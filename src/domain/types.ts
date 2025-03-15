export interface Airport {
  name: string;
  id: string;
  time: string;
  timeDate: Date; // Remove optional flag since we always set it
}

export interface Flight {
  // Flattened structure with non-nested properties
  flight_id: string; // Unique identifier for each flight
  origin_iata: string;
  destination_iata: string;
  origin_name: string;
  destination_name: string;
  departure_time: string;
  arrival: string;
  departure_date: string;
  arrival_date: string;
  duration: number;
  company: string;
  company_logo: string;
  flight: string;
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