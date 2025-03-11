import { Airport, Flight, FlightResponse } from '../domain/types';
import { cleanText, parseDuration, extractLogoUrl } from './scraper.utils';

export class ScraperService {
  private static readonly USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
  private static readonly TIMEOUT = 10000; // 10 seconds timeout like Go version

  private static async fetchHtml(url: string): Promise<Response> {
    console.log('Fetching URL:', url);
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT);

    try {
      // Keep only essential headers that match Go implementation
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': this.USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Cookie': 'CONSENT=YES+GB.en+202510+170+666'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out after 10 seconds');
        }
        throw new Error(`Failed to fetch HTML: ${error.message}`);
      }
      throw new Error('Failed to fetch HTML: Unknown error');
    }
  }

  private static extractDateFromUrl(url: string): string {
    const searchParams = new URL(url).searchParams;
    const tfs = searchParams.get('tfs');
    if (!tfs) throw new Error('No search parameters found in URL');

    // Decode the protobuf data to get the date
    const data = atob(tfs.replace(/-/g, '+').replace(/_/g, '/'));
    // The date is stored in YYYY-MM-DD format at a fixed position
    const dateMatch = data.match(/\d{4}-\d{2}-\d{2}/);
    if (!dateMatch) throw new Error('No date found in search parameters');
    
    return dateMatch[0];
  }

  private static createEmptyFlight(): Flight {
    return {
      departureAirport: {
        name: '',
        id: '',
        time: '',
        timeDate: new Date()
      },
      arrivalAirport: {
        name: '',
        id: '',
        time: '',
        timeDate: new Date()
      },
      duration: 0,
      airline: '',
      airlineLogo: '',
      flightNumber: ''
    };
  }

  public static async extractFlights(url: string): Promise<FlightResponse> {
    console.log('Starting flight extraction from:', url);
    
    const flightDate = this.extractDateFromUrl(url);
    console.log('Extracted flight date:', flightDate);

    // Extract origin and destination from URL parameters
    const searchParams = new URL(url).searchParams;
    const origin = searchParams.get('origin') || '';
    const destination = searchParams.get('destination') || '';

    const response: FlightResponse = {
      flights: [],
      totalDuration: 0,
      price: 0,
      type: 'One way',
      airlineLogo: '',
      bookingToken: ''
    };

    const uniqueFlights = new Map<string, Flight>();
    let currentFlight = this.createEmptyFlight();

    try {
      const htmlResponse = await this.fetchHtml(url);
      
      const rewriter = new HTMLRewriter()
        .on('.JMc5Xc', {
          element(element) {
            const desc = element.getAttribute('aria-label');
            if (desc) {
              const parts = desc.split('. ');
              for (const part of parts) {
                if (part.startsWith('Leaves ')) {
                  const idx = part.indexOf(' at ');
                  if (idx !== -1) {
                    currentFlight.departureAirport.name = part.substring(7, idx);
                    currentFlight.departureAirport.id = origin;
                  }
                }
                if (part.includes('arrives at ')) {
                  const idx = part.indexOf('arrives at ');
                  if (idx !== -1) {
                    const rest = part.substring(idx + 10);
                    const endIdx = rest.indexOf(' at ');
                    if (endIdx !== -1) {
                      currentFlight.arrivalAirport.name = rest.substring(0, endIdx);
                      currentFlight.arrivalAirport.id = destination;
                    }
                  }
                }
              }
            }
          }
        })
        .on('[aria-label^="Departure time:"]', {
          element(element) {
            const label = element.getAttribute('aria-label');
            if (label) {
              let time = cleanText(label.replace('Departure time: ', '').replace('.', ''));
              const timeStr = `${flightDate} ${time}`;
              currentFlight.departureAirport.time = timeStr;
              currentFlight.departureAirport.timeDate = new Date(timeStr);
            }
          }
        })
        .on('[aria-label^="Arrival time:"]', {
          element(element) {
            const label = element.getAttribute('aria-label');
            if (label) {
              let time = cleanText(label.replace('Arrival time: ', '').replace('.', ''));
              const timeStr = `${flightDate} ${time}`;
              currentFlight.arrivalAirport.time = timeStr;
              currentFlight.arrivalAirport.timeDate = new Date(timeStr);
            }
          }
        })
        .on('.gvkrdb', {
          element(element) {
            const durationLabel = element.getAttribute('aria-label') || element.textContent;
            if (durationLabel) {
              let durationText = durationLabel;
              if (durationLabel.startsWith('Total duration ')) {
                durationText = durationLabel.replace('Total duration ', '').replace('.', '');
              }
              currentFlight.duration = parseDuration(durationText);
              
              if (response.totalDuration === 0 || currentFlight.duration < response.totalDuration) {
                response.totalDuration = currentFlight.duration;
              }
            }
          }
        })
        .on('.YMlIz.FpEdX.jLMuyc', {
          text(text) {
            const priceStr = cleanText(text.text).replace('€', '');
            const price = parseInt(priceStr, 10);
            if (!isNaN(price)) {
              response.price = price;
            }
          }
        })
        .on('.EbY4Pc', {
          element(element) {
            const style = element.getAttribute('style');
            if (style) {
              const logoUrl = extractLogoUrl(style);
              if (logoUrl) {
                currentFlight.airlineLogo = logoUrl;
                response.airlineLogo = logoUrl;
              }
            }
          }
        })
        .on('div.Ir0Voe .sSHqwe', {
          text(text) {
            if (text.text) {
              currentFlight.airline = text.text.trim();
            }
          }
        })
        .on('.NZRfve', {
          element(element) {
            const url = element.getAttribute('data-travelimpactmodelwebsiteurl');
            if (url) {
              const parts = url.split('-');
              if (parts.length > 3) {
                currentFlight.flightNumber = `${parts[2]} ${parts[3]}`;
              }
              response.bookingToken = url;

              // Store flight if we have all required data
              if (currentFlight.departureAirport.time && 
                  currentFlight.arrivalAirport.time && 
                  currentFlight.duration > 0) {
                // Store flight in unique flights map
                const key = `${currentFlight.flightNumber}-${currentFlight.departureAirport.time}`;
                uniqueFlights.set(key, { ...currentFlight });
                // Reset for next flight
                currentFlight = ScraperService.createEmptyFlight();
              }
            }
          }
        });

      const transformed = await rewriter.transform(htmlResponse);
      await transformed.text(); // Consume the response to ensure all handlers are executed

      // Convert unique flights map to array and sort by departure time
      response.flights = Array.from(uniqueFlights.values())
        .sort((a, b) => a.departureAirport.timeDate.getTime() - b.departureAirport.timeDate.getTime());

      console.log(`Found ${response.flights.length} flights`);
      console.log(`Lowest price: €${response.price}, Total duration: ${response.totalDuration} minutes`);

      return response;
    } catch (error: unknown) {
      console.error('Flight extraction error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unknown error during flight extraction');
    }
  }
}