var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// .wrangler/tmp/bundle-4d0KB7/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// dist/index.js
var v = Object.defineProperty;
var M = /* @__PURE__ */ __name((h, t, e) => t in h ? v(h, t, { enumerable: true, configurable: true, writable: true, value: e }) : h[t] = e, "M");
var p = /* @__PURE__ */ __name((h, t, e) => (M(h, typeof t != "symbol" ? t + "" : t, e), e), "p");
var f = /* @__PURE__ */ __name(class {
  static writeVarint(t) {
    let e = [];
    for (typeof t == "number" && (t = BigInt(t)); t > BigInt(127); )
      e.push(Number(t & BigInt(127)) | 128), t = t >> BigInt(7);
    return e.push(Number(t)), e;
  }
  static writeString(t) {
    let e = new TextEncoder().encode(t);
    return [...this.writeVarint(e.length), ...e];
  }
  static writeField(t, e, i) {
    let r = t << 3 | e;
    return [...this.writeVarint(r), ...i];
  }
  static createAirportMessage(t) {
    return [...this.writeField(1, 0, this.writeVarint(1)), ...this.writeField(2, 2, this.writeString(t))];
  }
  static createFlightInfoMessage(t, e, i) {
    let r = this.createAirportMessage(e), s = this.createAirportMessage(i);
    return [...this.writeField(2, 2, this.writeString(t)), ...this.writeField(5, 0, this.writeVarint(0)), ...this.writeField(13, 2, [...this.writeVarint(r.length), ...r]), ...this.writeField(14, 2, [...this.writeVarint(s.length), ...s])];
  }
  static createField16ValueMessage() {
    return [...this.writeField(1, 0, this.writeVarint(this.MAX_UINT64))];
  }
  static createFlightSearch(t, e, i) {
    let r = this.createFlightInfoMessage(i, t, e), s = this.createField16ValueMessage(), n = [...this.writeField(1, 0, this.writeVarint(28)), ...this.writeField(2, 0, this.writeVarint(2)), ...this.writeField(3, 2, [...this.writeVarint(r.length), ...r]), ...this.writeField(8, 0, this.writeVarint(1)), ...this.writeField(9, 0, this.writeVarint(1)), ...this.writeField(14, 0, this.writeVarint(1)), ...this.writeField(16, 2, [...this.writeVarint(s.length), ...s]), ...this.writeField(19, 0, this.writeVarint(2))];
    return new Uint8Array(n);
  }
  static async encodeFlightSearch(t, e, i) {
    let r = this.createFlightSearch(t, e, i);
    return this.toBase64Url(r);
  }
  static toBase64Url(t) {
    return btoa(String.fromCharCode(...t)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }
  static fromBase64Url(t) {
    let e = t.replace(/-/g, "+").replace(/_/g, "/"), i = atob(e), r = new Uint8Array(i.length);
    for (let s = 0; s < i.length; s++)
      r[s] = i.charCodeAt(s);
    return r;
  }
}, "f");
p(f, "MAX_UINT64", BigInt("18446744073709551615"));
var w = /* @__PURE__ */ __name((h) => {
  let t = h.split(/\s+/), e = /* @__PURE__ */ new Set();
  return t.filter((r) => e.has(r) ? false : (e.add(r), true)).join(" ").trim();
}, "w");
var x = /* @__PURE__ */ __name((h) => {
  let e = w(h).split(" "), i = 0;
  for (let r = 0; r < e.length - 1; r += 2) {
    let s = parseInt(e[r], 10), n = e[r + 1].toLowerCase();
    n.startsWith("hr") ? i += s * 60 : n.startsWith("min") && (i += s);
  }
  return i;
}, "x");
var T = /* @__PURE__ */ __name((h) => {
  let t = h.match(/url\((.*?)\)/);
  return t ? t[1].replace(/['"]/g, "") : "";
}, "T");
var F = /* @__PURE__ */ __name(class {
  static async fetchHtml(t) {
    console.log("Fetching URL:", t);
    let e = new AbortController(), i = setTimeout(() => e.abort(), this.TIMEOUT);
    try {
      let r = await fetch(t, { method: "GET", headers: { "User-Agent": this.USER_AGENT, Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8", "Accept-Language": "en-US,en;q=0.9", Connection: "keep-alive", Cookie: "CONSENT=YES+GB.en+202510+170+666" }, signal: e.signal });
      if (clearTimeout(i), !r.ok)
        throw new Error(`HTTP error! status: ${r.status}`);
      return r;
    } catch (r) {
      throw clearTimeout(i), r instanceof Error ? r.name === "AbortError" ? new Error("Request timed out after 10 seconds") : new Error(`Failed to fetch HTML: ${r.message}`) : new Error("Failed to fetch HTML: Unknown error");
    }
  }
  static extractDateFromUrl(t) {
    let i = new URL(t).searchParams.get("tfs");
    if (!i)
      throw new Error("No search parameters found in URL");
    let s = atob(i.replace(/-/g, "+").replace(/_/g, "/")).match(/\d{4}-\d{2}-\d{2}/);
    if (!s)
      throw new Error("No date found in search parameters");
    return s[0];
  }
  static createEmptyFlight() {
    return { departureAirport: { name: "", id: "", time: "", timeDate: /* @__PURE__ */ new Date() }, arrivalAirport: { name: "", id: "", time: "", timeDate: /* @__PURE__ */ new Date() }, duration: 0, airline: "", airlineLogo: "", flightNumber: "" };
  }
  static async extractFlights(t) {
    console.log("Starting flight extraction from:", t);
    let e = this.extractDateFromUrl(t);
    console.log("Extracted flight date:", e);
    let i = new URL(t).searchParams, r = i.get("origin") || "", s = i.get("destination") || "", n = { flights: [], totalDuration: 0, price: 0, type: "One way", airlineLogo: "", bookingToken: "" }, E = /* @__PURE__ */ new Map(), o = this.createEmptyFlight();
    try {
      let m = await this.fetchHtml(t);
      return await (await new HTMLRewriter().on(".JMc5Xc", { element(l) {
        let a = l.getAttribute("aria-label");
        if (a) {
          let c = a.split(". ");
          for (let g of c) {
            if (g.startsWith("Leaves ")) {
              let d = g.indexOf(" at ");
              d !== -1 && (o.departureAirport.name = g.substring(7, d), o.departureAirport.id = r);
            }
            if (g.includes("arrives at ")) {
              let d = g.indexOf("arrives at ");
              if (d !== -1) {
                let R = g.substring(d + 10), y = R.indexOf(" at ");
                y !== -1 && (o.arrivalAirport.name = R.substring(0, y), o.arrivalAirport.id = s);
              }
            }
          }
        }
      } }).on('[aria-label^="Departure time:"]', { element(l) {
        let a = l.getAttribute("aria-label");
        if (a) {
          let c = w(a.replace("Departure time: ", "").replace(".", "")), g = `${e} ${c}`;
          o.departureAirport.time = g, o.departureAirport.timeDate = new Date(g);
        }
      } }).on('[aria-label^="Arrival time:"]', { element(l) {
        let a = l.getAttribute("aria-label");
        if (a) {
          let c = w(a.replace("Arrival time: ", "").replace(".", "")), g = `${e} ${c}`;
          o.arrivalAirport.time = g, o.arrivalAirport.timeDate = new Date(g);
        }
      } }).on(".gvkrdb", { element(l) {
        let a = l.getAttribute("aria-label") || l.textContent;
        if (a) {
          let c = a;
          a.startsWith("Total duration ") && (c = a.replace("Total duration ", "").replace(".", "")), o.duration = x(c), (n.totalDuration === 0 || o.duration < n.totalDuration) && (n.totalDuration = o.duration);
        }
      } }).on(".YMlIz.FpEdX.jLMuyc", { text(l) {
        let a = w(l.text).replace("\u20AC", ""), c = parseInt(a, 10);
        isNaN(c) || (n.price = c);
      } }).on(".EbY4Pc", { element(l) {
        let a = l.getAttribute("style");
        if (a) {
          let c = T(a);
          c && (o.airlineLogo = c, n.airlineLogo = c);
        }
      } }).on(".sSHqwe span", { text(l) {
        o.airline = l.text.trim();
      } }).on(".NZRfve", { element(l) {
        let a = l.getAttribute("data-travelimpactmodelwebsiteurl");
        if (a) {
          let c = a.split("-");
          if (c.length > 3 && (o.flightNumber = `${c[2]} ${c[3]}`), n.bookingToken = a, o.departureAirport.time && o.arrivalAirport.time && o.duration > 0) {
            let g = `${o.flightNumber}-${o.departureAirport.time}`;
            E.set(g, { ...o }), o = F.createEmptyFlight();
          }
        }
      } }).transform(m)).text(), n.flights = Array.from(E.values()).sort((l, a) => l.departureAirport.timeDate.getTime() - a.departureAirport.timeDate.getTime()), console.log(`Found ${n.flights.length} flights`), console.log(`Lowest price: \u20AC${n.price}, Total duration: ${n.totalDuration} minutes`), n;
    } catch (m) {
      throw console.error("Flight extraction error:", m), m instanceof Error ? m : new Error("Unknown error during flight extraction");
    }
  }
}, "F");
var u = F;
p(u, "USER_AGENT", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"), p(u, "TIMEOUT", 1e4);
var b = /* @__PURE__ */ __name(class {
  static validateInput(t, e, i) {
    if (!t || !e || !i)
      throw new Error("Origin, destination, and date are required");
    if (!/^[A-Z]{3}$/.test(t) || !/^[A-Z]{3}$/.test(e))
      throw new Error("Airport codes must be 3 uppercase letters");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(i))
      throw new Error("Date must be in YYYY-MM-DD format");
    let r = new Date(i);
    if (isNaN(r.getTime()))
      throw new Error("Invalid date");
  }
  static async searchFlights(t, e, i) {
    console.log(`Searching flights from ${t} to ${e} on ${i}`);
    try {
      this.validateInput(t, e, i);
      let r = await f.encodeFlightSearch(t, e, i);
      console.log("Encoded search parameters");
      let s = new URL(this.BASE_URL);
      s.searchParams.set("tfs", r), s.searchParams.set("tfu", "EgYIAxAAGAA"), s.searchParams.set("hl", "en"), s.searchParams.set("origin", t), s.searchParams.set("destination", e), console.log("Generated URL:", s.toString());
      let n = await u.extractFlights(s.toString());
      return await this.cacheResponse(t, e, i, n), console.log("Successfully retrieved flights:", { count: n.flights.length, totalDuration: n.totalDuration, price: n.price }), n;
    } catch (r) {
      throw console.error("Failed to search flights:", r), new Error(`Failed to search flights from ${t} to ${e}: ${r instanceof Error ? r.message : "Unknown error"}`);
    }
  }
  static async cacheResponse(t, e, i, r) {
    try {
      let s = `flights:${t}:${e}:${i}`;
      console.log("Cached response with key:", s);
    } catch (s) {
      console.warn("Failed to cache response:", s);
    }
  }
}, "b");
p(b, "BASE_URL", "https://www.google.com/travel/flights/search");
var A = /* @__PURE__ */ __name(class {
  static jsonResponse(t, e = 200) {
    return new Response(JSON.stringify(t, null, 2), { status: e, headers: { "Content-Type": "application/json", ...this.corsHeaders } });
  }
  static errorResponse(t, e = 500, i) {
    console.error("API Error:", { error: t instanceof Error ? t.message : t, stack: t instanceof Error ? t.stack : void 0, details: i });
    let r = { error: t instanceof Error ? t.message : t, status: e, details: i };
    return this.jsonResponse(r, e);
  }
  static async handleRequest(t) {
    console.log("Handling request:", t.url);
    try {
      if (t.method === "OPTIONS")
        return new Response(null, { headers: this.corsHeaders });
      if (t.method !== "GET")
        return this.errorResponse("Method not allowed", 405);
      let e = new URL(t.url);
      if (console.log("Request path:", e.pathname), console.log("Request params:", Object.fromEntries(e.searchParams)), e.pathname === "/flights") {
        let i = e.searchParams.get("origin"), r = e.searchParams.get("destination"), s = e.searchParams.get("date");
        if (!i || !r || !s)
          return this.errorResponse("Missing required parameters: origin, destination, and date are required", 400, { params: { originCode: i, destinationCode: r, date: s } });
        if (!/^[A-Z]{3}$/.test(i) || !/^[A-Z]{3}$/.test(r))
          return this.errorResponse("Invalid airport code format. Must be 3 uppercase letters", 400, { params: { originCode: i, destinationCode: r } });
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
          return this.errorResponse("Invalid date format. Must be YYYY-MM-DD", 400, { params: { date: s } });
        try {
          console.log("Searching flights...");
          let n = await b.searchFlights(i, r, s);
          return console.log("Search completed successfully"), this.jsonResponse(n);
        } catch (n) {
          return console.error("Flight search error:", n), this.errorResponse(`Failed to search flights from ${i} to ${r}`, 500, { originalError: n instanceof Error ? n.message : n });
        }
      }
      return this.errorResponse("Not found", 404);
    } catch (e) {
      return console.error("Unhandled API error:", e), this.errorResponse(e);
    }
  }
}, "A");
p(A, "corsHeaders", { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" });
var C = { async fetch(h, t, e) {
  try {
    return await A.handleRequest(h);
  } catch (i) {
    return console.error("Worker Error:", i), new Response(JSON.stringify({ error: "Internal Server Error", status: 500 }), { status: 500, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  }
} };

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-4d0KB7/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = C;

// node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-4d0KB7/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof __Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
__name(__Facade_ScheduledController__, "__Facade_ScheduledController__");
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = (request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    };
    #dispatcher = (type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    };
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
