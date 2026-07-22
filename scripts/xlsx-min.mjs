/**
 * xlsx-min.mjs — escritor mínimo de planilha .xlsx, sem dependência nova.
 *
 * O projeto não tem (e não vai ganhar por causa de um script) uma lib de
 * Excel, então aqui está o mínimo do formato OOXML: um ZIP com quatro XMLs.
 * Só o que a proposta precisa — uma aba, cabeçalho em negrito, congelado,
 * autofiltro, larguras de coluna, texto e número.
 *
 * Uso:
 *   import { escreverXlsx } from "./xlsx-min.mjs";
 *   await escreverXlsx("saida.xlsx", {
 *     aba: "proposta",
 *     colunas: [{ titulo: "id", largura: 10 }, ...],
 *     linhas: [[123, "texto", ...], ...],
 *   });
 */

import { writeFile } from "node:fs/promises";
import { deflateRawSync } from "node:zlib";

/** Tabela do CRC-32 exigida pelo formato ZIP. */
const TABELA_CRC = (() => {
  const tabela = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    tabela[i] = c >>> 0;
  }
  return tabela;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (let i = 0; i < buffer.length; i++) {
    c = TABELA_CRC[(c ^ buffer[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * ZIP sem compressão de diretório, data fixa (1980-01-01) para que rodar
 * o script duas vezes com o mesmo dado gere o mesmo arquivo — diff limpo.
 */
function zipar(arquivos) {
  const locais = [];
  const centrais = [];
  let offset = 0;

  for (const { nome, dados } of arquivos) {
    const nomeBuf = Buffer.from(nome, "utf8");
    const comprimido = deflateRawSync(dados);
    const crc = crc32(dados);

    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0);
    local.writeUInt16LE(20, 4); // versão necessária
    local.writeUInt16LE(0x0800, 6); // nomes em UTF-8
    local.writeUInt16LE(8, 8); // método deflate
    local.writeUInt16LE(0, 10); // hora
    local.writeUInt16LE(33, 12); // data 1980-01-01
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(comprimido.length, 18);
    local.writeUInt32LE(dados.length, 22);
    local.writeUInt16LE(nomeBuf.length, 26);
    local.writeUInt16LE(0, 28);
    locais.push(local, nomeBuf, comprimido);

    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0);
    central.writeUInt16LE(20, 4); // versão de criação
    central.writeUInt16LE(20, 6); // versão necessária
    central.writeUInt16LE(0x0800, 8);
    central.writeUInt16LE(8, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(33, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(comprimido.length, 20);
    central.writeUInt32LE(dados.length, 24);
    central.writeUInt16LE(nomeBuf.length, 28);
    central.writeUInt16LE(0, 30); // extra
    central.writeUInt16LE(0, 32); // comentário
    central.writeUInt16LE(0, 34); // disco
    central.writeUInt16LE(0, 36); // atributos internos
    central.writeUInt32LE(0, 38); // atributos externos
    central.writeUInt32LE(offset, 42);
    centrais.push(central, nomeBuf);

    offset += local.length + nomeBuf.length + comprimido.length;
  }

  const corpoCentral = Buffer.concat(centrais);
  const fim = Buffer.alloc(22);
  fim.writeUInt32LE(0x06054b50, 0);
  fim.writeUInt16LE(0, 4);
  fim.writeUInt16LE(0, 6);
  fim.writeUInt16LE(arquivos.length, 8);
  fim.writeUInt16LE(arquivos.length, 10);
  fim.writeUInt32LE(corpoCentral.length, 12);
  fim.writeUInt32LE(offset, 16);
  fim.writeUInt16LE(0, 20);

  return Buffer.concat([...locais, corpoCentral, fim]);
}

function escapar(texto) {
  return String(texto)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    // O XML do Excel não aceita caracteres de controle.
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}

/** A1, B1, ... Z1, AA1 — endereço da célula. */
function endereco(coluna, linha) {
  let n = coluna + 1;
  let letras = "";
  while (n > 0) {
    const resto = (n - 1) % 26;
    letras = String.fromCharCode(65 + resto) + letras;
    n = Math.floor((n - resto) / 26);
  }
  return `${letras}${linha}`;
}

function celula(valor, coluna, linha, estilo) {
  const ref = endereco(coluna, linha);
  const s = estilo ? ` s="${estilo}"` : "";
  if (typeof valor === "number" && Number.isFinite(valor)) {
    return `<c r="${ref}"${s}><v>${valor}</v></c>`;
  }
  const texto = valor === null || valor === undefined ? "" : String(valor);
  if (!texto) return `<c r="${ref}"${s}/>`;
  return (
    `<c r="${ref}"${s} t="inlineStr"><is><t xml:space="preserve">` +
    `${escapar(texto)}</t></is></c>`
  );
}

/**
 * Escreve a planilha. `colunas` é [{ titulo, largura, quebraLinha }] e
 * `linhas` é uma matriz de valores (string ou number) na mesma ordem.
 */
export async function escreverXlsx(caminho, { aba, colunas, linhas }) {
  const totalColunas = colunas.length;
  const totalLinhas = linhas.length + 1;
  const ultima = endereco(totalColunas - 1, totalLinhas);

  const cabecalho = colunas
    .map((c, i) => celula(c.titulo, i, 1, 1))
    .join("");
  const corpo = linhas
    .map((valores, iLinha) => {
      const numero = iLinha + 2;
      const celulas = colunas
        .map((c, iCol) =>
          celula(valores[iCol], iCol, numero, c.quebraLinha ? 2 : 0),
        )
        .join("");
      return `<row r="${numero}">${celulas}</row>`;
    })
    .join("");

  const cols = colunas
    .map(
      (c, i) =>
        `<col min="${i + 1}" max="${i + 1}" width="${c.largura ?? 18}" customWidth="1"/>`,
    )
    .join("");

  const sheet =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    `<dimension ref="A1:${ultima}"/>` +
    '<sheetViews><sheetView workbookViewId="0">' +
    '<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>' +
    "</sheetView></sheetViews>" +
    '<sheetFormatPr defaultRowHeight="15"/>' +
    `<cols>${cols}</cols>` +
    `<sheetData><row r="1">${cabecalho}</row>${corpo}</sheetData>` +
    `<autoFilter ref="A1:${ultima}"/>` +
    "</worksheet>";

  const workbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" ' +
    'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">' +
    `<sheets><sheet name="${escapar(aba)}" sheetId="1" r:id="rId1"/></sheets>` +
    "</workbook>";

  const styles =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font>' +
    '<font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    // O Excel espera os dois primeiros fills nesta ordem (none, gray125).
    '<fills count="2"><fill><patternFill patternType="none"/></fill>' +
    '<fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border/></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="3">' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>' +
    '<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1">' +
    '<alignment vertical="top" wrapText="1"/></xf>' +
    "</cellXfs></styleSheet>";

  const contentTypes =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>' +
    '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>' +
    '<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' +
    "</Types>";

  const rels =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>' +
    "</Relationships>";

  const relsWorkbook =
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>' +
    '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>' +
    "</Relationships>";

  const zip = zipar([
    { nome: "[Content_Types].xml", dados: Buffer.from(contentTypes, "utf8") },
    { nome: "_rels/.rels", dados: Buffer.from(rels, "utf8") },
    { nome: "xl/workbook.xml", dados: Buffer.from(workbook, "utf8") },
    { nome: "xl/_rels/workbook.xml.rels", dados: Buffer.from(relsWorkbook, "utf8") },
    { nome: "xl/styles.xml", dados: Buffer.from(styles, "utf8") },
    { nome: "xl/worksheets/sheet1.xml", dados: Buffer.from(sheet, "utf8") },
  ]);

  await writeFile(caminho, zip);
}
