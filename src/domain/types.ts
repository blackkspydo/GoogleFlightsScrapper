export interface Airport {
  name: string;
  id: string;
  time: string;
  timeDate: Date; // Remove optional flag since we always set it
}

export interface Flight {
  departureAirport: Airport;
  arrivalAirport: Airport;
  duration: number;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
}

export interface FlightResponse {
  flights: Flight[];
  totalDuration: number;
  price: number;
  type: string;
  airlineLogo: string;
  bookingToken: string;
}

export interface FlightSearch {
  field1: number;
  field2: number;
  flightInfo: {
    date: string;
    filterStops: number;
    origin: {
      field1: number;
      code: string;
    };
    destination: {
      field1: number;
      code: string;
    };
  };
  field8: number;
  field9: number;
  field14: number;
  field16: {
    field1: number;
  };
  field19: number;
}