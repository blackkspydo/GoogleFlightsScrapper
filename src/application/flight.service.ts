import { FlightResponse } from '../domain/types';
import { ProtobufService } from '../infrastructure/protobuf.service';
import { ScraperService } from '../infrastructure/scraper.service';

export class FlightService {
  private static readonly BASE_URL = 'https://www.google.com/travel/flights/search';

  private static validateInput(originCode: string, destinationCode: string, date: string): void {
    if (!originCode || !destinationCode || !date) {
      throw new Error('Origin, destination, and date are required');
    }

    if (!/^[A-Z]{3}$/.test(originCode) || !/^[A-Z]{3}$/.test(destinationCode)) {
      throw new Error('Airport codes must be 3 uppercase letters');
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('Date must be in YYYY-MM-DD format');
    }

    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) {
      throw new Error('Invalid date');
    }
  }

  public static async searchFlights(
    originCode: string,
    destinationCode: string,
    date: string
  ): Promise<FlightResponse> {
    console.log(`Searching flights from ${originCode} to ${destinationCode} on ${date}`);
    
    try {
      // Validate input
      this.validateInput(originCode, destinationCode, date);

      // Encode search parameters
      const encoded = await ProtobufService.encodeFlightSearch(
        originCode,
        destinationCode,
        date
      );
      console.log('Encoded search parameters');
      
      // Build URL with parameters
      const url = new URL(this.BASE_URL);
      url.searchParams.set('tfs', encoded);
      url.searchParams.set('tfu', 'EgYIAxAAGAA');
      url.searchParams.set('hl', 'en');
      // Add origin and destination codes for the scraper
      url.searchParams.set('origin', originCode);
      url.searchParams.set('destination', destinationCode);

      console.log('Generated URL:', url.toString());

      // Extract flights
      const response = await ScraperService.extractFlights(url.toString());
      
      // Cache response
      await this.cacheResponse(originCode, destinationCode, date, response);
      
      console.log('Successfully retrieved flights:', {
        count: response.flights.length,
        totalDuration: response.totalDuration,
        price: response.price
      });

      return response;
    } catch (error) {
      console.error('Failed to search flights:', error);
      throw new Error(
        `Failed to search flights from ${originCode} to ${destinationCode}: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  }

  private static async cacheResponse(
    originCode: string,
    destinationCode: string,
    date: string,
    response: FlightResponse
  ): Promise<void> {
    try {
      const cacheKey = `flights:${originCode}:${destinationCode}:${date}`;
      // Example using KV (uncomment when using Cloudflare Workers)
      // await FLIGHTS_KV.put(cacheKey, JSON.stringify(response), {
      //   expirationTtl: 3600 // Cache for 1 hour
      // });
      console.log('Cached response with key:', cacheKey);
    } catch (error) {
      console.warn('Failed to cache response:', error);
      // Don't throw error for cache failures
    }
  }
}