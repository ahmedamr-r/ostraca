/* A small ZIP writer, so the site can offer the skill as one download.
   Deflated entries and a fixed date, so the same files always make the
   same bytes. Nothing else, on purpose, and no dependencies.

     zip([{ name: "ostraca/SKILL.md", data: Buffer }]) -> Buffer  */
import { deflateRawSync } from "node:zlib";

const CRC = Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const DATE = (1 << 5) | 1; // 1 January 1980, the first day DOS time can say

export function zip(files) {
  const body = [], dir = [];
  let at = 0;
  for (const { name, data } of files) {
    const path = Buffer.from(name), packed = deflateRawSync(data, { level: 9 }), crc = crc32(data);
    // The local header, then the entry's name and its deflated bytes.
    const head = Buffer.alloc(30);
    head.writeUInt32LE(0x04034b50, 0);
    head.writeUInt16LE(20, 4);              // version needed: 2.0, for deflate
    head.writeUInt16LE(8, 8);               // deflated
    head.writeUInt16LE(DATE, 12);
    head.writeUInt32LE(crc, 14);
    head.writeUInt32LE(packed.length, 18);
    head.writeUInt32LE(data.length, 22);
    head.writeUInt16LE(path.length, 26);
    // Its line in the central directory, pointing back at the header.
    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0);
    entry.writeUInt16LE(20, 4);             // made by 2.0
    entry.writeUInt16LE(20, 6);
    entry.writeUInt16LE(8, 10);
    entry.writeUInt16LE(DATE, 14);
    entry.writeUInt32LE(crc, 16);
    entry.writeUInt32LE(packed.length, 20);
    entry.writeUInt32LE(data.length, 24);
    entry.writeUInt16LE(path.length, 28);
    entry.writeUInt32LE(at, 42);
    body.push(head, path, packed);
    dir.push(entry, path);
    at += head.length + path.length + packed.length;
  }
  const size = dir.reduce((sum, b) => sum + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(size, 12);
  end.writeUInt32LE(at, 16);
  return Buffer.concat([...body, ...dir, end]);
}
