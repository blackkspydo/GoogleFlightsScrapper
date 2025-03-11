import { FlightSearch } from '../domain/types';

export class ProtobufService {
  private static readonly MAX_UINT64 = BigInt('18446744073709551615');

  private static writeVarint(value: number | bigint): number[] {
    const result: number[] = [];
    if (typeof value === 'number') {
      value = BigInt(value);
    }
    while (value > BigInt(127)) {
      result.push(Number(value & BigInt(127)) | 128);
      value = value >> BigInt(7);
    }
    result.push(Number(value));
    return result;
  }

  private static writeString(value: string): number[] {
    const bytes = new TextEncoder().encode(value);
    return [...this.writeVarint(bytes.length), ...bytes];
  }

  private static writeField(fieldNumber: number, wireType: number, value: number[]): number[] {
    const tag = (fieldNumber << 3) | wireType;
    return [...this.writeVarint(tag), ...value];
  }

  private static createAirportMessage(code: string): number[] {
    return [
      ...this.writeField(1, 0, this.writeVarint(1)), // field1 = 1
      ...this.writeField(2, 2, this.writeString(code)) // code = airport code
    ];
  }

  private static createFlightInfoMessage(date: string, originCode: string, destinationCode: string): number[] {
    const origin = this.createAirportMessage(originCode);
    const destination = this.createAirportMessage(destinationCode);

    return [
      ...this.writeField(2, 2, this.writeString(date)), // date field (2)
      ...this.writeField(5, 0, this.writeVarint(0)), // filter_stops field (5)
      ...this.writeField(13, 2, [...this.writeVarint(origin.length), ...origin]), // origin field (13)
      ...this.writeField(14, 2, [...this.writeVarint(destination.length), ...destination]) // destination field (14)
    ];
  }

  private static createField16ValueMessage(): number[] {
    return [
      ...this.writeField(1, 0, this.writeVarint(this.MAX_UINT64)) // field1 = MAX_UINT64
    ];
  }

  public static createFlightSearch(
    originCode: string,
    destinationCode: string,
    date: string
  ): Uint8Array {
    // Create FlightInfo message
    const flightInfo = this.createFlightInfoMessage(date, originCode, destinationCode);
    
    // Create Field16Value message
    const field16Value = this.createField16ValueMessage();

    // Create FlightSearch message following exact proto field order
    const searchMsg = [
      ...this.writeField(1, 0, this.writeVarint(28)), // field1 = 28 (1)
      ...this.writeField(2, 0, this.writeVarint(2)), // field2 = 2 (2)
      ...this.writeField(3, 2, [...this.writeVarint(flightInfo.length), ...flightInfo]), // flight_info (3)
      ...this.writeField(8, 0, this.writeVarint(1)), // field8 = 1 (8)
      ...this.writeField(9, 0, this.writeVarint(1)), // field9 = 1 (9)
      ...this.writeField(14, 0, this.writeVarint(1)), // field14 = 1 (14)
      ...this.writeField(16, 2, [...this.writeVarint(field16Value.length), ...field16Value]), // field16 (16)
      ...this.writeField(19, 0, this.writeVarint(2)) // field19 = 2 (19)
    ];

    return new Uint8Array(searchMsg);
  }

  public static async encodeFlightSearch(
    originCode: string,
    destinationCode: string,
    date: string
  ): Promise<string> {
    const data = this.createFlightSearch(originCode, destinationCode, date);
    return this.toBase64Url(data);
  }

  private static toBase64Url(data: Uint8Array): string {
    // Convert to base64 and make URL safe
    return btoa(String.fromCharCode(...data))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }

  private static fromBase64Url(encoded: string): Uint8Array {
    // Convert from URL safe base64 back to binary
    const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
}