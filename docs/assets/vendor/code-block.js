function _n(a) {
  return a && a.__esModule && Object.prototype.hasOwnProperty.call(a, "default") ? a.default : a;
}
var Ke, dt;
function vn() {
  if (dt) return Ke;
  dt = 1;
  function a(t) {
    return t instanceof Map ? t.clear = t.delete = t.set = function() {
      throw new Error("map is read-only");
    } : t instanceof Set && (t.add = t.clear = t.delete = function() {
      throw new Error("set is read-only");
    }), Object.freeze(t), Object.getOwnPropertyNames(t).forEach((s) => {
      const l = t[s], y = typeof l;
      (y === "object" || y === "function") && !Object.isFrozen(l) && a(l);
    }), t;
  }
  class e {
    /**
     * @param {CompiledMode} mode
     */
    constructor(s) {
      s.data === void 0 && (s.data = {}), this.data = s.data, this.isMatchIgnored = !1;
    }
    ignoreMatch() {
      this.isMatchIgnored = !0;
    }
  }
  function n(t) {
    return t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#x27;");
  }
  function r(t, ...s) {
    const l = /* @__PURE__ */ Object.create(null);
    for (const y in t)
      l[y] = t[y];
    return s.forEach(function(y) {
      for (const H in y)
        l[H] = y[H];
    }), /** @type {T} */
    l;
  }
  const o = "</span>", c = (t) => !!t.scope, b = (t, { prefix: s }) => {
    if (t.startsWith("language:"))
      return t.replace("language:", "language-");
    if (t.includes(".")) {
      const l = t.split(".");
      return [
        `${s}${l.shift()}`,
        ...l.map((y, H) => `${y}${"_".repeat(H + 1)}`)
      ].join(" ");
    }
    return `${s}${t}`;
  };
  class h {
    /**
     * Creates a new HTMLRenderer
     *
     * @param {Tree} parseTree - the parse tree (must support `walk` API)
     * @param {{classPrefix: string}} options
     */
    constructor(s, l) {
      this.buffer = "", this.classPrefix = l.classPrefix, s.walk(this);
    }
    /**
     * Adds texts to the output stream
     *
     * @param {string} text */
    addText(s) {
      this.buffer += n(s);
    }
    /**
     * Adds a node open to the output stream (if needed)
     *
     * @param {Node} node */
    openNode(s) {
      if (!c(s)) return;
      const l = b(
        s.scope,
        { prefix: this.classPrefix }
      );
      this.span(l);
    }
    /**
     * Adds a node close to the output stream (if needed)
     *
     * @param {Node} node */
    closeNode(s) {
      c(s) && (this.buffer += o);
    }
    /**
     * returns the accumulated buffer
    */
    value() {
      return this.buffer;
    }
    // helpers
    /**
     * Builds a span element
     *
     * @param {string} className */
    span(s) {
      this.buffer += `<span class="${s}">`;
    }
  }
  const u = (t = {}) => {
    const s = { children: [] };
    return Object.assign(s, t), s;
  };
  class f {
    constructor() {
      this.rootNode = u(), this.stack = [this.rootNode];
    }
    get top() {
      return this.stack[this.stack.length - 1];
    }
    get root() {
      return this.rootNode;
    }
    /** @param {Node} node */
    add(s) {
      this.top.children.push(s);
    }
    /** @param {string} scope */
    openNode(s) {
      const l = u({ scope: s });
      this.add(l), this.stack.push(l);
    }
    closeNode() {
      if (this.stack.length > 1)
        return this.stack.pop();
    }
    closeAllNodes() {
      for (; this.closeNode(); ) ;
    }
    toJSON() {
      return JSON.stringify(this.rootNode, null, 4);
    }
    /**
     * @typedef { import("./html_renderer").Renderer } Renderer
     * @param {Renderer} builder
     */
    walk(s) {
      return this.constructor._walk(s, this.rootNode);
    }
    /**
     * @param {Renderer} builder
     * @param {Node} node
     */
    static _walk(s, l) {
      return typeof l == "string" ? s.addText(l) : l.children && (s.openNode(l), l.children.forEach((y) => this._walk(s, y)), s.closeNode(l)), s;
    }
    /**
     * @param {Node} node
     */
    static _collapse(s) {
      typeof s != "string" && s.children && (s.children.every((l) => typeof l == "string") ? s.children = [s.children.join("")] : s.children.forEach((l) => {
        f._collapse(l);
      }));
    }
  }
  class E extends f {
    /**
     * @param {*} options
     */
    constructor(s) {
      super(), this.options = s;
    }
    /**
     * @param {string} text
     */
    addText(s) {
      s !== "" && this.add(s);
    }
    /** @param {string} scope */
    startScope(s) {
      this.openNode(s);
    }
    endScope() {
      this.closeNode();
    }
    /**
     * @param {Emitter & {root: DataNode}} emitter
     * @param {string} name
     */
    __addSublanguage(s, l) {
      const y = s.root;
      l && (y.scope = `language:${l}`), this.add(y);
    }
    toHTML() {
      return new h(this, this.options).value();
    }
    finalize() {
      return this.closeAllNodes(), !0;
    }
  }
  function S(t) {
    return t ? typeof t == "string" ? t : t.source : null;
  }
  function x(t) {
    return N("(?=", t, ")");
  }
  function A(t) {
    return N("(?:", t, ")*");
  }
  function M(t) {
    return N("(?:", t, ")?");
  }
  function N(...t) {
    return t.map((l) => S(l)).join("");
  }
  function B(t) {
    const s = t[t.length - 1];
    return typeof s == "object" && s.constructor === Object ? (t.splice(t.length - 1, 1), s) : {};
  }
  function $(...t) {
    return "(" + (B(t).capture ? "" : "?:") + t.map((y) => S(y)).join("|") + ")";
  }
  function P(t) {
    return new RegExp(t.toString() + "|").exec("").length - 1;
  }
  function W(t, s) {
    const l = t && t.exec(s);
    return l && l.index === 0;
  }
  const Q = /\[(?:[^\\\]]|\\.)*\]|\(\??|\\([1-9][0-9]*)|\\./;
  function G(t, { joinWith: s }) {
    let l = 0;
    return t.map((y) => {
      l += 1;
      const H = l;
      let z = S(y), p = "";
      for (; z.length > 0; ) {
        const g = Q.exec(z);
        if (!g) {
          p += z;
          break;
        }
        p += z.substring(0, g.index), z = z.substring(g.index + g[0].length), g[0][0] === "\\" && g[1] ? p += "\\" + String(Number(g[1]) + H) : (p += g[0], g[0] === "(" && l++);
      }
      return p;
    }).map((y) => `(${y})`).join(s);
  }
  const j = /\b\B/, re = "[a-zA-Z]\\w*", q = "[a-zA-Z_]\\w*", se = "\\b\\d+(\\.\\d+)?", oe = "(-?)(\\b0[xX][a-fA-F0-9]+|(\\b\\d+(\\.\\d*)?|\\.\\d+)([eE][-+]?\\d+)?)", ie = "\\b(0b[01]+)", ce = "!|!=|!==|%|%=|&|&&|&=|\\*|\\*=|\\+|\\+=|,|-|-=|/=|/|:|;|<<|<<=|<=|<|===|==|=|>>>=|>>=|>=|>>>|>>|>|\\?|\\[|\\{|\\(|\\^|\\^=|\\||\\|=|\\|\\||~", te = (t = {}) => {
    const s = /^#![ ]*\//;
    return t.binary && (t.begin = N(
      s,
      /.*\b/,
      t.binary,
      /\b.*/
    )), r({
      scope: "meta",
      begin: s,
      end: /$/,
      relevance: 0,
      /** @type {ModeCallback} */
      "on:begin": (l, y) => {
        l.index !== 0 && y.ignoreMatch();
      }
    }, t);
  }, D = {
    begin: "\\\\[\\s\\S]",
    relevance: 0
  }, U = {
    scope: "string",
    begin: "'",
    end: "'",
    illegal: "\\n",
    contains: [D]
  }, Y = {
    scope: "string",
    begin: '"',
    end: '"',
    illegal: "\\n",
    contains: [D]
  }, J = {
    begin: /\b(a|an|the|are|I'm|isn't|don't|doesn't|won't|but|just|should|pretty|simply|enough|gonna|going|wtf|so|such|will|you|your|they|like|more)\b/
  }, k = function(t, s, l = {}) {
    const y = r(
      {
        scope: "comment",
        begin: t,
        end: s,
        contains: []
      },
      l
    );
    y.contains.push({
      scope: "doctag",
      // hack to avoid the space from being included. the space is necessary to
      // match here to prevent the plain text rule below from gobbling up doctags
      begin: "[ ]*(?=(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):)",
      end: /(TODO|FIXME|NOTE|BUG|OPTIMIZE|HACK|XXX):/,
      excludeBegin: !0,
      relevance: 0
    });
    const H = $(
      // list of common 1 and 2 letter words in English
      "I",
      "a",
      "is",
      "so",
      "us",
      "to",
      "at",
      "if",
      "in",
      "it",
      "on",
      // note: this is not an exhaustive list of contractions, just popular ones
      /[A-Za-z]+['](d|ve|re|ll|t|s|n)/,
      // contractions - can't we'd they're let's, etc
      /[A-Za-z]+[-][a-z]+/,
      // `no-way`, etc.
      /[A-Za-z][a-z]{2,}/
      // allow capitalized words at beginning of sentences
    );
    return y.contains.push(
      {
        // TODO: how to include ", (, ) without breaking grammars that use these for
        // comment delimiters?
        // begin: /[ ]+([()"]?([A-Za-z'-]{3,}|is|a|I|so|us|[tT][oO]|at|if|in|it|on)[.]?[()":]?([.][ ]|[ ]|\))){3}/
        // ---
        // this tries to find sequences of 3 english words in a row (without any
        // "programming" type syntax) this gives us a strong signal that we've
        // TRULY found a comment - vs perhaps scanning with the wrong language.
        // It's possible to find something that LOOKS like the start of the
        // comment - but then if there is no readable text - good chance it is a
        // false match and not a comment.
        //
        // for a visual example please see:
        // https://github.com/highlightjs/highlight.js/issues/2827
        begin: N(
          /[ ]+/,
          // necessary to prevent us gobbling up doctags like /* @author Bob Mcgill */
          "(",
          H,
          /[.]?[:]?([.][ ]|[ ])/,
          "){3}"
        )
        // look for 3 words in a row
      }
    ), y;
  }, ee = k("//", "$"), ne = k("/\\*", "\\*/"), le = k("#", "$"), ge = {
    scope: "number",
    begin: se,
    relevance: 0
  }, me = {
    scope: "number",
    begin: oe,
    relevance: 0
  }, Tt = {
    scope: "number",
    begin: ie,
    relevance: 0
  }, Rt = {
    scope: "regexp",
    begin: /\/(?=[^/\n]*\/)/,
    end: /\/[gimuy]*/,
    contains: [
      D,
      {
        begin: /\[/,
        end: /\]/,
        relevance: 0,
        contains: [D]
      }
    ]
  }, Ct = {
    scope: "title",
    begin: re,
    relevance: 0
  }, Mt = {
    scope: "title",
    begin: q,
    relevance: 0
  }, Ot = {
    // excludes method names from keyword processing
    begin: "\\.\\s*" + q,
    relevance: 0
  };
  var ke = /* @__PURE__ */ Object.freeze({
    __proto__: null,
    APOS_STRING_MODE: U,
    BACKSLASH_ESCAPE: D,
    BINARY_NUMBER_MODE: Tt,
    BINARY_NUMBER_RE: ie,
    COMMENT: k,
    C_BLOCK_COMMENT_MODE: ne,
    C_LINE_COMMENT_MODE: ee,
    C_NUMBER_MODE: me,
    C_NUMBER_RE: oe,
    END_SAME_AS_BEGIN: function(t) {
      return Object.assign(
        t,
        {
          /** @type {ModeCallback} */
          "on:begin": (s, l) => {
            l.data._beginMatch = s[1];
          },
          /** @type {ModeCallback} */
          "on:end": (s, l) => {
            l.data._beginMatch !== s[1] && l.ignoreMatch();
          }
        }
      );
    },
    HASH_COMMENT_MODE: le,
    IDENT_RE: re,
    MATCH_NOTHING_RE: j,
    METHOD_GUARD: Ot,
    NUMBER_MODE: ge,
    NUMBER_RE: se,
    PHRASAL_WORDS_MODE: J,
    QUOTE_STRING_MODE: Y,
    REGEXP_MODE: Rt,
    RE_STARTERS_RE: ce,
    SHEBANG: te,
    TITLE_MODE: Ct,
    UNDERSCORE_IDENT_RE: q,
    UNDERSCORE_TITLE_MODE: Mt
  });
  function Lt(t, s) {
    t.input[t.index - 1] === "." && s.ignoreMatch();
  }
  function It(t, s) {
    t.className !== void 0 && (t.scope = t.className, delete t.className);
  }
  function $t(t, s) {
    s && t.beginKeywords && (t.begin = "\\b(" + t.beginKeywords.split(" ").join("|") + ")(?!\\.)(?=\\b|\\s)", t.__beforeBegin = Lt, t.keywords = t.keywords || t.beginKeywords, delete t.beginKeywords, t.relevance === void 0 && (t.relevance = 0));
  }
  function Bt(t, s) {
    Array.isArray(t.illegal) && (t.illegal = $(...t.illegal));
  }
  function Dt(t, s) {
    if (t.match) {
      if (t.begin || t.end) throw new Error("begin & end are not supported with match");
      t.begin = t.match, delete t.match;
    }
  }
  function Pt(t, s) {
    t.relevance === void 0 && (t.relevance = 1);
  }
  const Ut = (t, s) => {
    if (!t.beforeMatch) return;
    if (t.starts) throw new Error("beforeMatch cannot be used with starts");
    const l = Object.assign({}, t);
    Object.keys(t).forEach((y) => {
      delete t[y];
    }), t.keywords = l.keywords, t.begin = N(l.beforeMatch, x(l.begin)), t.starts = {
      relevance: 0,
      contains: [
        Object.assign(l, { endsParent: !0 })
      ]
    }, t.relevance = 0, delete l.beforeMatch;
  }, Ht = [
    "of",
    "and",
    "for",
    "in",
    "not",
    "or",
    "if",
    "then",
    "parent",
    // common variable name
    "list",
    // common variable name
    "value"
    // common variable name
  ], zt = "keyword";
  function qe(t, s, l = zt) {
    const y = /* @__PURE__ */ Object.create(null);
    return typeof t == "string" ? H(l, t.split(" ")) : Array.isArray(t) ? H(l, t) : Object.keys(t).forEach(function(z) {
      Object.assign(
        y,
        qe(t[z], s, z)
      );
    }), y;
    function H(z, p) {
      s && (p = p.map((g) => g.toLowerCase())), p.forEach(function(g) {
        const v = g.split("|");
        y[v[0]] = [z, Ft(v[0], v[1])];
      });
    }
  }
  function Ft(t, s) {
    return s ? Number(s) : Gt(t) ? 0 : 1;
  }
  function Gt(t) {
    return Ht.includes(t.toLowerCase());
  }
  const Ye = {}, _e = (t) => {
    console.error(t);
  }, Xe = (t, ...s) => {
    console.log(`WARN: ${t}`, ...s);
  }, ye = (t, s) => {
    Ye[`${t}/${s}`] || (console.log(`Deprecated as of ${t}. ${s}`), Ye[`${t}/${s}`] = !0);
  }, Ne = new Error();
  function Ve(t, s, { key: l }) {
    let y = 0;
    const H = t[l], z = {}, p = {};
    for (let g = 1; g <= s.length; g++)
      p[g + y] = H[g], z[g + y] = !0, y += P(s[g - 1]);
    t[l] = p, t[l]._emit = z, t[l]._multi = !0;
  }
  function jt(t) {
    if (Array.isArray(t.begin)) {
      if (t.skip || t.excludeBegin || t.returnBegin)
        throw _e("skip, excludeBegin, returnBegin not compatible with beginScope: {}"), Ne;
      if (typeof t.beginScope != "object" || t.beginScope === null)
        throw _e("beginScope must be object"), Ne;
      Ve(t, t.begin, { key: "beginScope" }), t.begin = G(t.begin, { joinWith: "" });
    }
  }
  function Zt(t) {
    if (Array.isArray(t.end)) {
      if (t.skip || t.excludeEnd || t.returnEnd)
        throw _e("skip, excludeEnd, returnEnd not compatible with endScope: {}"), Ne;
      if (typeof t.endScope != "object" || t.endScope === null)
        throw _e("endScope must be object"), Ne;
      Ve(t, t.end, { key: "endScope" }), t.end = G(t.end, { joinWith: "" });
    }
  }
  function Kt(t) {
    t.scope && typeof t.scope == "object" && t.scope !== null && (t.beginScope = t.scope, delete t.scope);
  }
  function Wt(t) {
    Kt(t), typeof t.beginScope == "string" && (t.beginScope = { _wrap: t.beginScope }), typeof t.endScope == "string" && (t.endScope = { _wrap: t.endScope }), jt(t), Zt(t);
  }
  function qt(t) {
    function s(p, g) {
      return new RegExp(
        S(p),
        "m" + (t.case_insensitive ? "i" : "") + (t.unicodeRegex ? "u" : "") + (g ? "g" : "")
      );
    }
    class l {
      constructor() {
        this.matchIndexes = {}, this.regexes = [], this.matchAt = 1, this.position = 0;
      }
      // @ts-ignore
      addRule(g, v) {
        v.position = this.position++, this.matchIndexes[this.matchAt] = v, this.regexes.push([v, g]), this.matchAt += P(g) + 1;
      }
      compile() {
        this.regexes.length === 0 && (this.exec = () => null);
        const g = this.regexes.map((v) => v[1]);
        this.matcherRe = s(G(g, { joinWith: "|" }), !0), this.lastIndex = 0;
      }
      /** @param {string} s */
      exec(g) {
        this.matcherRe.lastIndex = this.lastIndex;
        const v = this.matcherRe.exec(g);
        if (!v)
          return null;
        const K = v.findIndex((Se, He) => He > 0 && Se !== void 0), F = this.matchIndexes[K];
        return v.splice(0, K), Object.assign(v, F);
      }
    }
    class y {
      constructor() {
        this.rules = [], this.multiRegexes = [], this.count = 0, this.lastIndex = 0, this.regexIndex = 0;
      }
      // @ts-ignore
      getMatcher(g) {
        if (this.multiRegexes[g]) return this.multiRegexes[g];
        const v = new l();
        return this.rules.slice(g).forEach(([K, F]) => v.addRule(K, F)), v.compile(), this.multiRegexes[g] = v, v;
      }
      resumingScanAtSamePosition() {
        return this.regexIndex !== 0;
      }
      considerAll() {
        this.regexIndex = 0;
      }
      // @ts-ignore
      addRule(g, v) {
        this.rules.push([g, v]), v.type === "begin" && this.count++;
      }
      /** @param {string} s */
      exec(g) {
        const v = this.getMatcher(this.regexIndex);
        v.lastIndex = this.lastIndex;
        let K = v.exec(g);
        if (this.resumingScanAtSamePosition() && !(K && K.index === this.lastIndex)) {
          const F = this.getMatcher(0);
          F.lastIndex = this.lastIndex + 1, K = F.exec(g);
        }
        return K && (this.regexIndex += K.position + 1, this.regexIndex === this.count && this.considerAll()), K;
      }
    }
    function H(p) {
      const g = new y();
      return p.contains.forEach((v) => g.addRule(v.begin, { rule: v, type: "begin" })), p.terminatorEnd && g.addRule(p.terminatorEnd, { type: "end" }), p.illegal && g.addRule(p.illegal, { type: "illegal" }), g;
    }
    function z(p, g) {
      const v = (
        /** @type CompiledMode */
        p
      );
      if (p.isCompiled) return v;
      [
        It,
        // do this early so compiler extensions generally don't have to worry about
        // the distinction between match/begin
        Dt,
        Wt,
        Ut
      ].forEach((F) => F(p, g)), t.compilerExtensions.forEach((F) => F(p, g)), p.__beforeBegin = null, [
        $t,
        // do this later so compiler extensions that come earlier have access to the
        // raw array if they wanted to perhaps manipulate it, etc.
        Bt,
        // default to 1 relevance if not specified
        Pt
      ].forEach((F) => F(p, g)), p.isCompiled = !0;
      let K = null;
      return typeof p.keywords == "object" && p.keywords.$pattern && (p.keywords = Object.assign({}, p.keywords), K = p.keywords.$pattern, delete p.keywords.$pattern), K = K || /\w+/, p.keywords && (p.keywords = qe(p.keywords, t.case_insensitive)), v.keywordPatternRe = s(K, !0), g && (p.begin || (p.begin = /\B|\b/), v.beginRe = s(v.begin), !p.end && !p.endsWithParent && (p.end = /\B|\b/), p.end && (v.endRe = s(v.end)), v.terminatorEnd = S(v.end) || "", p.endsWithParent && g.terminatorEnd && (v.terminatorEnd += (p.end ? "|" : "") + g.terminatorEnd)), p.illegal && (v.illegalRe = s(
        /** @type {RegExp | string} */
        p.illegal
      )), p.contains || (p.contains = []), p.contains = [].concat(...p.contains.map(function(F) {
        return Yt(F === "self" ? p : F);
      })), p.contains.forEach(function(F) {
        z(
          /** @type Mode */
          F,
          v
        );
      }), p.starts && z(p.starts, g), v.matcher = H(v), v;
    }
    if (t.compilerExtensions || (t.compilerExtensions = []), t.contains && t.contains.includes("self"))
      throw new Error("ERR: contains `self` is not supported at the top-level of a language.  See documentation.");
    return t.classNameAliases = r(t.classNameAliases || {}), z(
      /** @type Mode */
      t
    );
  }
  function Qe(t) {
    return t ? t.endsWithParent || Qe(t.starts) : !1;
  }
  function Yt(t) {
    return t.variants && !t.cachedVariants && (t.cachedVariants = t.variants.map(function(s) {
      return r(t, { variants: null }, s);
    })), t.cachedVariants ? t.cachedVariants : Qe(t) ? r(t, { starts: t.starts ? r(t.starts) : null }) : Object.isFrozen(t) ? r(t) : t;
  }
  var Xt = "11.11.1";
  class Vt extends Error {
    constructor(s, l) {
      super(s), this.name = "HTMLInjectionError", this.html = l;
    }
  }
  const Ue = n, Je = r, et = Symbol("nomatch"), Qt = 7, tt = function(t) {
    const s = /* @__PURE__ */ Object.create(null), l = /* @__PURE__ */ Object.create(null), y = [];
    let H = !0;
    const z = "Could not find the language '{}', did you forget to load/include a language module?", p = { disableAutodetect: !0, name: "Plain text", contains: [] };
    let g = {
      ignoreUnescapedHTML: !1,
      throwUnescapedHTML: !1,
      noHighlightRe: /^(no-?highlight)$/i,
      languageDetectRe: /\blang(?:uage)?-([\w-]+)\b/i,
      classPrefix: "hljs-",
      cssSelector: "pre code",
      languages: null,
      // beta configuration options, subject to change, welcome to discuss
      // https://github.com/highlightjs/highlight.js/issues/1086
      __emitter: E
    };
    function v(i) {
      return g.noHighlightRe.test(i);
    }
    function K(i) {
      let _ = i.className + " ";
      _ += i.parentNode ? i.parentNode.className : "";
      const R = g.languageDetectRe.exec(_);
      if (R) {
        const L = pe(R[1]);
        return L || (Xe(z.replace("{}", R[1])), Xe("Falling back to no-highlight mode for this block.", i)), L ? R[1] : "no-highlight";
      }
      return _.split(/\s+/).find((L) => v(L) || pe(L));
    }
    function F(i, _, R) {
      let L = "", Z = "";
      typeof _ == "object" ? (L = i, R = _.ignoreIllegals, Z = _.language) : (ye("10.7.0", "highlight(lang, code, ...args) has been deprecated."), ye("10.7.0", `Please use highlight(code, options) instead.
https://github.com/highlightjs/highlight.js/issues/2277`), Z = i, L = _), R === void 0 && (R = !0);
      const de = {
        code: L,
        language: Z
      };
      Re("before:highlight", de);
      const fe = de.result ? de.result : Se(de.language, de.code, R);
      return fe.code = de.code, Re("after:highlight", fe), fe;
    }
    function Se(i, _, R, L) {
      const Z = /* @__PURE__ */ Object.create(null);
      function de(d, m) {
        return d.keywords[m];
      }
      function fe() {
        if (!w.keywords) {
          X.addText(I);
          return;
        }
        let d = 0;
        w.keywordPatternRe.lastIndex = 0;
        let m = w.keywordPatternRe.exec(I), T = "";
        for (; m; ) {
          T += I.substring(d, m.index);
          const O = be.case_insensitive ? m[0].toLowerCase() : m[0], V = de(w, O);
          if (V) {
            const [he, fn] = V;
            if (X.addText(T), T = "", Z[O] = (Z[O] || 0) + 1, Z[O] <= Qt && (Oe += fn), he.startsWith("_"))
              T += m[0];
            else {
              const mn = be.classNameAliases[he] || he;
              ue(m[0], mn);
            }
          } else
            T += m[0];
          d = w.keywordPatternRe.lastIndex, m = w.keywordPatternRe.exec(I);
        }
        T += I.substring(d), X.addText(T);
      }
      function Ce() {
        if (I === "") return;
        let d = null;
        if (typeof w.subLanguage == "string") {
          if (!s[w.subLanguage]) {
            X.addText(I);
            return;
          }
          d = Se(w.subLanguage, I, !0, lt[w.subLanguage]), lt[w.subLanguage] = /** @type {CompiledMode} */
          d._top;
        } else
          d = ze(I, w.subLanguage.length ? w.subLanguage : null);
        w.relevance > 0 && (Oe += d.relevance), X.__addSublanguage(d._emitter, d.language);
      }
      function ae() {
        w.subLanguage != null ? Ce() : fe(), I = "";
      }
      function ue(d, m) {
        d !== "" && (X.startScope(m), X.addText(d), X.endScope());
      }
      function st(d, m) {
        let T = 1;
        const O = m.length - 1;
        for (; T <= O; ) {
          if (!d._emit[T]) {
            T++;
            continue;
          }
          const V = be.classNameAliases[d[T]] || d[T], he = m[T];
          V ? ue(he, V) : (I = he, fe(), I = ""), T++;
        }
      }
      function ot(d, m) {
        return d.scope && typeof d.scope == "string" && X.openNode(be.classNameAliases[d.scope] || d.scope), d.beginScope && (d.beginScope._wrap ? (ue(I, be.classNameAliases[d.beginScope._wrap] || d.beginScope._wrap), I = "") : d.beginScope._multi && (st(d.beginScope, m), I = "")), w = Object.create(d, { parent: { value: w } }), w;
      }
      function it(d, m, T) {
        let O = W(d.endRe, T);
        if (O) {
          if (d["on:end"]) {
            const V = new e(d);
            d["on:end"](m, V), V.isMatchIgnored && (O = !1);
          }
          if (O) {
            for (; d.endsParent && d.parent; )
              d = d.parent;
            return d;
          }
        }
        if (d.endsWithParent)
          return it(d.parent, m, T);
      }
      function un(d) {
        return w.matcher.regexIndex === 0 ? (I += d[0], 1) : (Ze = !0, 0);
      }
      function bn(d) {
        const m = d[0], T = d.rule, O = new e(T), V = [T.__beforeBegin, T["on:begin"]];
        for (const he of V)
          if (he && (he(d, O), O.isMatchIgnored))
            return un(m);
        return T.skip ? I += m : (T.excludeBegin && (I += m), ae(), !T.returnBegin && !T.excludeBegin && (I = m)), ot(T, d), T.returnBegin ? 0 : m.length;
      }
      function gn(d) {
        const m = d[0], T = _.substring(d.index), O = it(w, d, T);
        if (!O)
          return et;
        const V = w;
        w.endScope && w.endScope._wrap ? (ae(), ue(m, w.endScope._wrap)) : w.endScope && w.endScope._multi ? (ae(), st(w.endScope, d)) : V.skip ? I += m : (V.returnEnd || V.excludeEnd || (I += m), ae(), V.excludeEnd && (I = m));
        do
          w.scope && X.closeNode(), !w.skip && !w.subLanguage && (Oe += w.relevance), w = w.parent;
        while (w !== O.parent);
        return O.starts && ot(O.starts, d), V.returnEnd ? 0 : m.length;
      }
      function hn() {
        const d = [];
        for (let m = w; m !== be; m = m.parent)
          m.scope && d.unshift(m.scope);
        d.forEach((m) => X.openNode(m));
      }
      let Me = {};
      function ct(d, m) {
        const T = m && m[0];
        if (I += d, T == null)
          return ae(), 0;
        if (Me.type === "begin" && m.type === "end" && Me.index === m.index && T === "") {
          if (I += _.slice(m.index, m.index + 1), !H) {
            const O = new Error(`0 width match regex (${i})`);
            throw O.languageName = i, O.badRule = Me.rule, O;
          }
          return 1;
        }
        if (Me = m, m.type === "begin")
          return bn(m);
        if (m.type === "illegal" && !R) {
          const O = new Error('Illegal lexeme "' + T + '" for mode "' + (w.scope || "<unnamed>") + '"');
          throw O.mode = w, O;
        } else if (m.type === "end") {
          const O = gn(m);
          if (O !== et)
            return O;
        }
        if (m.type === "illegal" && T === "")
          return I += `
`, 1;
        if (je > 1e5 && je > m.index * 3)
          throw new Error("potential infinite loop, way more iterations than matches");
        return I += T, T.length;
      }
      const be = pe(i);
      if (!be)
        throw _e(z.replace("{}", i)), new Error('Unknown language: "' + i + '"');
      const pn = qt(be);
      let Ge = "", w = L || pn;
      const lt = {}, X = new g.__emitter(g);
      hn();
      let I = "", Oe = 0, ve = 0, je = 0, Ze = !1;
      try {
        if (be.__emitTokens)
          be.__emitTokens(_, X);
        else {
          for (w.matcher.considerAll(); ; ) {
            je++, Ze ? Ze = !1 : w.matcher.considerAll(), w.matcher.lastIndex = ve;
            const d = w.matcher.exec(_);
            if (!d) break;
            const m = _.substring(ve, d.index), T = ct(m, d);
            ve = d.index + T;
          }
          ct(_.substring(ve));
        }
        return X.finalize(), Ge = X.toHTML(), {
          language: i,
          value: Ge,
          relevance: Oe,
          illegal: !1,
          _emitter: X,
          _top: w
        };
      } catch (d) {
        if (d.message && d.message.includes("Illegal"))
          return {
            language: i,
            value: Ue(_),
            illegal: !0,
            relevance: 0,
            _illegalBy: {
              message: d.message,
              index: ve,
              context: _.slice(ve - 100, ve + 100),
              mode: d.mode,
              resultSoFar: Ge
            },
            _emitter: X
          };
        if (H)
          return {
            language: i,
            value: Ue(_),
            illegal: !1,
            relevance: 0,
            errorRaised: d,
            _emitter: X,
            _top: w
          };
        throw d;
      }
    }
    function He(i) {
      const _ = {
        value: Ue(i),
        illegal: !1,
        relevance: 0,
        _top: p,
        _emitter: new g.__emitter(g)
      };
      return _._emitter.addText(i), _;
    }
    function ze(i, _) {
      _ = _ || g.languages || Object.keys(s);
      const R = He(i), L = _.filter(pe).filter(rt).map(
        (ae) => Se(ae, i, !1)
      );
      L.unshift(R);
      const Z = L.sort((ae, ue) => {
        if (ae.relevance !== ue.relevance) return ue.relevance - ae.relevance;
        if (ae.language && ue.language) {
          if (pe(ae.language).supersetOf === ue.language)
            return 1;
          if (pe(ue.language).supersetOf === ae.language)
            return -1;
        }
        return 0;
      }), [de, fe] = Z, Ce = de;
      return Ce.secondBest = fe, Ce;
    }
    function Jt(i, _, R) {
      const L = _ && l[_] || R;
      i.classList.add("hljs"), i.classList.add(`language-${L}`);
    }
    function Fe(i) {
      let _ = null;
      const R = K(i);
      if (v(R)) return;
      if (Re(
        "before:highlightElement",
        { el: i, language: R }
      ), i.dataset.highlighted) {
        console.log("Element previously highlighted. To highlight again, first unset `dataset.highlighted`.", i);
        return;
      }
      if (i.children.length > 0 && (g.ignoreUnescapedHTML || (console.warn("One of your code blocks includes unescaped HTML. This is a potentially serious security risk."), console.warn("https://github.com/highlightjs/highlight.js/wiki/security"), console.warn("The element with unescaped HTML:"), console.warn(i)), g.throwUnescapedHTML))
        throw new Vt(
          "One of your code blocks includes unescaped HTML.",
          i.innerHTML
        );
      _ = i;
      const L = _.textContent, Z = R ? F(L, { language: R, ignoreIllegals: !0 }) : ze(L);
      i.innerHTML = Z.value, i.dataset.highlighted = "yes", Jt(i, R, Z.language), i.result = {
        language: Z.language,
        // TODO: remove with version 11.0
        re: Z.relevance,
        relevance: Z.relevance
      }, Z.secondBest && (i.secondBest = {
        language: Z.secondBest.language,
        relevance: Z.secondBest.relevance
      }), Re("after:highlightElement", { el: i, result: Z, text: L });
    }
    function en(i) {
      g = Je(g, i);
    }
    const tn = () => {
      Te(), ye("10.6.0", "initHighlighting() deprecated.  Use highlightAll() now.");
    };
    function nn() {
      Te(), ye("10.6.0", "initHighlightingOnLoad() deprecated.  Use highlightAll() now.");
    }
    let nt = !1;
    function Te() {
      function i() {
        Te();
      }
      if (document.readyState === "loading") {
        nt || window.addEventListener("DOMContentLoaded", i, !1), nt = !0;
        return;
      }
      document.querySelectorAll(g.cssSelector).forEach(Fe);
    }
    function an(i, _) {
      let R = null;
      try {
        R = _(t);
      } catch (L) {
        if (_e("Language definition for '{}' could not be registered.".replace("{}", i)), H)
          _e(L);
        else
          throw L;
        R = p;
      }
      R.name || (R.name = i), s[i] = R, R.rawDefinition = _.bind(null, t), R.aliases && at(R.aliases, { languageName: i });
    }
    function rn(i) {
      delete s[i];
      for (const _ of Object.keys(l))
        l[_] === i && delete l[_];
    }
    function sn() {
      return Object.keys(s);
    }
    function pe(i) {
      return i = (i || "").toLowerCase(), s[i] || s[l[i]];
    }
    function at(i, { languageName: _ }) {
      typeof i == "string" && (i = [i]), i.forEach((R) => {
        l[R.toLowerCase()] = _;
      });
    }
    function rt(i) {
      const _ = pe(i);
      return _ && !_.disableAutodetect;
    }
    function on(i) {
      i["before:highlightBlock"] && !i["before:highlightElement"] && (i["before:highlightElement"] = (_) => {
        i["before:highlightBlock"](
          Object.assign({ block: _.el }, _)
        );
      }), i["after:highlightBlock"] && !i["after:highlightElement"] && (i["after:highlightElement"] = (_) => {
        i["after:highlightBlock"](
          Object.assign({ block: _.el }, _)
        );
      });
    }
    function cn(i) {
      on(i), y.push(i);
    }
    function ln(i) {
      const _ = y.indexOf(i);
      _ !== -1 && y.splice(_, 1);
    }
    function Re(i, _) {
      const R = i;
      y.forEach(function(L) {
        L[R] && L[R](_);
      });
    }
    function dn(i) {
      return ye("10.7.0", "highlightBlock will be removed entirely in v12.0"), ye("10.7.0", "Please use highlightElement now."), Fe(i);
    }
    Object.assign(t, {
      highlight: F,
      highlightAuto: ze,
      highlightAll: Te,
      highlightElement: Fe,
      // TODO: Remove with v12 API
      highlightBlock: dn,
      configure: en,
      initHighlighting: tn,
      initHighlightingOnLoad: nn,
      registerLanguage: an,
      unregisterLanguage: rn,
      listLanguages: sn,
      getLanguage: pe,
      registerAliases: at,
      autoDetection: rt,
      inherit: Je,
      addPlugin: cn,
      removePlugin: ln
    }), t.debugMode = function() {
      H = !1;
    }, t.safeMode = function() {
      H = !0;
    }, t.versionString = Xt, t.regex = {
      concat: N,
      lookahead: x,
      either: $,
      optional: M,
      anyNumberOfTimes: A
    };
    for (const i in ke)
      typeof ke[i] == "object" && a(ke[i]);
    return Object.assign(t, ke), t;
  }, xe = tt({});
  return xe.newInstance = () => tt({}), Ke = xe, xe.HighlightJS = xe, xe.default = xe, Ke;
}
var En = /* @__PURE__ */ vn();
const C = /* @__PURE__ */ _n(En), ut = "[A-Za-z$_][0-9A-Za-z$_]*", yn = [
  "as",
  // for exports
  "in",
  "of",
  "if",
  "for",
  "while",
  "finally",
  "var",
  "new",
  "function",
  "do",
  "return",
  "void",
  "else",
  "break",
  "catch",
  "instanceof",
  "with",
  "throw",
  "case",
  "default",
  "try",
  "switch",
  "continue",
  "typeof",
  "delete",
  "let",
  "yield",
  "const",
  "class",
  // JS handles these with a special rule
  // "get",
  // "set",
  "debugger",
  "async",
  "await",
  "static",
  "import",
  "from",
  "export",
  "extends",
  // It's reached stage 3, which is "recommended for implementation":
  "using"
], xn = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], bt = [
  // Fundamental objects
  "Object",
  "Function",
  "Boolean",
  "Symbol",
  // numbers and dates
  "Math",
  "Date",
  "Number",
  "BigInt",
  // text
  "String",
  "RegExp",
  // Indexed collections
  "Array",
  "Float32Array",
  "Float64Array",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Int32Array",
  "Uint16Array",
  "Uint32Array",
  "BigInt64Array",
  "BigUint64Array",
  // Keyed collections
  "Set",
  "Map",
  "WeakSet",
  "WeakMap",
  // Structured data
  "ArrayBuffer",
  "SharedArrayBuffer",
  "Atomics",
  "DataView",
  "JSON",
  // Control abstraction objects
  "Promise",
  "Generator",
  "GeneratorFunction",
  "AsyncFunction",
  // Reflection
  "Reflect",
  "Proxy",
  // Internationalization
  "Intl",
  // WebAssembly
  "WebAssembly"
], gt = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], ht = [
  "setInterval",
  "setTimeout",
  "clearInterval",
  "clearTimeout",
  "require",
  "exports",
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "unescape"
], wn = [
  "arguments",
  "this",
  "super",
  "console",
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "module",
  "global"
  // Node.js
], Sn = [].concat(
  ht,
  bt,
  gt
);
function pt(a) {
  const e = a.regex, n = (k, { after: ee }) => {
    const ne = "</" + k[0].slice(1);
    return k.input.indexOf(ne, ee) !== -1;
  }, r = ut, o = {
    begin: "<>",
    end: "</>"
  }, c = /<[A-Za-z0-9\\._:-]+\s*\/>/, b = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (k, ee) => {
      const ne = k[0].length + k.index, le = k.input[ne];
      if (
        // HTML should not include another raw `` inside a tag
        // nested type?
        // `Array<Array<number>`, etc.
        le === "<" || // the , gives away that this is not HTML
        // `T, A extends keyof T, V`
        le === ","
      ) {
        ee.ignoreMatch();
        return;
      }
      le === ">" && (n(k, { after: ne }) || ee.ignoreMatch());
      let ge;
      const me = k.input.substring(ne);
      if (ge = me.match(/^\s*=/)) {
        ee.ignoreMatch();
        return;
      }
      if ((ge = me.match(/^\s+extends\s+/)) && ge.index === 0) {
        ee.ignoreMatch();
        return;
      }
    }
  }, h = {
    $pattern: ut,
    keyword: yn,
    literal: xn,
    built_in: Sn,
    "variable.language": wn
  }, u = "[0-9](_?[0-9])*", f = `\\.(${u})`, E = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", S = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${E})((${f})|\\.)?|(${f}))[eE][+-]?(${u})\\b` },
      { begin: `\\b(${E})\\b((${f})\\b|\\.)?|(${f})\\b` },
      // DecimalBigIntegerLiteral
      { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
      // NonDecimalIntegerLiteral
      { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
      { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
      { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
      // LegacyOctalIntegerLiteral (does not include underscore separators)
      // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
      { begin: "\\b0[0-7]+n?\\b" }
    ],
    relevance: 0
  }, x = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: h,
    contains: []
    // defined later
  }, A = {
    begin: ".?html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        a.BACKSLASH_ESCAPE,
        x
      ],
      subLanguage: "xml"
    }
  }, M = {
    begin: ".?css`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        a.BACKSLASH_ESCAPE,
        x
      ],
      subLanguage: "css"
    }
  }, N = {
    begin: ".?gql`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        a.BACKSLASH_ESCAPE,
        x
      ],
      subLanguage: "graphql"
    }
  }, B = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      a.BACKSLASH_ESCAPE,
      x
    ]
  }, P = {
    className: "comment",
    variants: [
      a.COMMENT(
        /\/\*\*(?!\/)/,
        "\\*/",
        {
          relevance: 0,
          contains: [
            {
              begin: "(?=@[A-Za-z]+)",
              relevance: 0,
              contains: [
                {
                  className: "doctag",
                  begin: "@[A-Za-z]+"
                },
                {
                  className: "type",
                  begin: "\\{",
                  end: "\\}",
                  excludeEnd: !0,
                  excludeBegin: !0,
                  relevance: 0
                },
                {
                  className: "variable",
                  begin: r + "(?=\\s*(-)|$)",
                  endsParent: !0,
                  relevance: 0
                },
                // eat spaces (not newlines) so we can find
                // types or variables
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      ),
      a.C_BLOCK_COMMENT_MODE,
      a.C_LINE_COMMENT_MODE
    ]
  }, W = [
    a.APOS_STRING_MODE,
    a.QUOTE_STRING_MODE,
    A,
    M,
    N,
    B,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    S
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  x.contains = W.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: h,
    contains: [
      "self"
    ].concat(W)
  });
  const Q = [].concat(P, x.contains), G = Q.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: h,
      contains: ["self"].concat(Q)
    }
  ]), j = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: h,
    contains: G
  }, re = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          r,
          /\s+/,
          /extends/,
          /\s+/,
          e.concat(r, "(", e.concat(/\./, r), ")*")
        ],
        scope: {
          1: "keyword",
          3: "title.class",
          5: "keyword",
          7: "title.class.inherited"
        }
      },
      // class Car
      {
        match: [
          /class/,
          /\s+/,
          r
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, q = {
    relevance: 0,
    match: e.either(
      // Hard coded exceptions
      /\bJSON/,
      // Float32Array, OutT
      /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
      // CSSFactory, CSSFactoryT
      /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
      // FPs, FPsT
      /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
      // P
      // single letters are not highlighted
      // BLAH
      // this will be flagged as a UPPER_CASE_CONSTANT instead
    ),
    className: "title.class",
    keywords: {
      _: [
        // se we still get relevance credit for JS library classes
        ...bt,
        ...gt
      ]
    }
  }, se = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, oe = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          r,
          /(?=\s*\()/
        ]
      },
      // anonymous function
      {
        match: [
          /function/,
          /\s*(?=\()/
        ]
      }
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    label: "func.def",
    contains: [j],
    illegal: /%/
  }, ie = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function ce(k) {
    return e.concat("(?!", k.join("|"), ")");
  }
  const te = {
    match: e.concat(
      /\b/,
      ce([
        ...ht,
        "super",
        "import"
      ].map((k) => `${k}\\s*\\(`)),
      r,
      e.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, D = {
    begin: e.concat(/\./, e.lookahead(
      e.concat(r, /(?![0-9A-Za-z$_(])/)
    )),
    end: r,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, U = {
    match: [
      /get|set/,
      /\s+/,
      r,
      /(?=\()/
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      {
        // eat to avoid empty params
        begin: /\(\)/
      },
      j
    ]
  }, Y = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + a.UNDERSCORE_IDENT_RE + ")\\s*=>", J = {
    match: [
      /const|var|let/,
      /\s+/,
      r,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      e.lookahead(Y)
    ],
    keywords: "async",
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      j
    ]
  };
  return {
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: h,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: G, CLASS_REFERENCE: q },
    illegal: /#(?![$_A-z])/,
    contains: [
      a.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      se,
      a.APOS_STRING_MODE,
      a.QUOTE_STRING_MODE,
      A,
      M,
      N,
      B,
      P,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      S,
      q,
      {
        scope: "attr",
        match: r + e.lookahead(":"),
        relevance: 0
      },
      J,
      {
        // "value" container
        begin: "(" + a.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          P,
          a.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: Y,
            returnBegin: !0,
            end: "\\s*=>",
            contains: [
              {
                className: "params",
                variants: [
                  {
                    begin: a.UNDERSCORE_IDENT_RE,
                    relevance: 0
                  },
                  {
                    className: null,
                    begin: /\(\s*\)/,
                    skip: !0
                  },
                  {
                    begin: /(\s*)\(/,
                    end: /\)/,
                    excludeBegin: !0,
                    excludeEnd: !0,
                    keywords: h,
                    contains: G
                  }
                ]
              }
            ]
          },
          {
            // could be a comma delimited list of params to a function call
            begin: /,/,
            relevance: 0
          },
          {
            match: /\s+/,
            relevance: 0
          },
          {
            // JSX
            variants: [
              { begin: o.begin, end: o.end },
              { match: c },
              {
                begin: b.begin,
                // we carefully check the opening tag to see if it truly
                // is a tag and not a false positive
                "on:begin": b.isTrulyOpeningTag,
                end: b.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: b.begin,
                end: b.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ]
      },
      oe,
      {
        // prevent this from getting swallowed up by function
        // since they appear "function like"
        beginKeywords: "while if switch catch for"
      },
      {
        // we have to count the parens to make sure we actually have the correct
        // bounding ( ).  There could be any number of sub-expressions inside
        // also surrounded by parens.
        begin: "\\b(?!function)" + a.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
        // end parens
        returnBegin: !0,
        label: "func.def",
        contains: [
          j,
          a.inherit(a.TITLE_MODE, { begin: r, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      D,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + r,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [j]
      },
      te,
      ie,
      re,
      U,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
const An = (a) => ({
  IMPORTANT: {
    scope: "meta",
    begin: "!important"
  },
  BLOCK_COMMENT: a.C_BLOCK_COMMENT_MODE,
  HEXCOLOR: {
    scope: "number",
    begin: /#(([0-9a-fA-F]{3,4})|(([0-9a-fA-F]{2}){3,4}))\b/
  },
  FUNCTION_DISPATCH: {
    className: "built_in",
    begin: /[\w-]+(?=\()/
  },
  ATTRIBUTE_SELECTOR_MODE: {
    scope: "selector-attr",
    begin: /\[/,
    end: /\]/,
    illegal: "$",
    contains: [
      a.APOS_STRING_MODE,
      a.QUOTE_STRING_MODE
    ]
  },
  CSS_NUMBER_MODE: {
    scope: "number",
    begin: a.NUMBER_RE + "(%|em|ex|ch|rem|vw|vh|vmin|vmax|cm|mm|in|pt|pc|px|deg|grad|rad|turn|s|ms|Hz|kHz|dpi|dpcm|dppx)?",
    relevance: 0
  },
  CSS_VARIABLE: {
    className: "attr",
    begin: /--[A-Za-z_][A-Za-z0-9_-]*/
  }
}), kn = [
  "a",
  "abbr",
  "address",
  "article",
  "aside",
  "audio",
  "b",
  "blockquote",
  "body",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "dd",
  "del",
  "details",
  "dfn",
  "div",
  "dl",
  "dt",
  "em",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hgroup",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "main",
  "mark",
  "menu",
  "nav",
  "object",
  "ol",
  "optgroup",
  "option",
  "p",
  "picture",
  "q",
  "quote",
  "samp",
  "section",
  "select",
  "source",
  "span",
  "strong",
  "summary",
  "sup",
  "table",
  "tbody",
  "td",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "tr",
  "ul",
  "var",
  "video"
], Nn = [
  "defs",
  "g",
  "marker",
  "mask",
  "pattern",
  "svg",
  "switch",
  "symbol",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feFlood",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMorphology",
  "feOffset",
  "feSpecularLighting",
  "feTile",
  "feTurbulence",
  "linearGradient",
  "radialGradient",
  "stop",
  "circle",
  "ellipse",
  "image",
  "line",
  "path",
  "polygon",
  "polyline",
  "rect",
  "text",
  "use",
  "textPath",
  "tspan",
  "foreignObject",
  "clipPath"
], Tn = [
  ...kn,
  ...Nn
], Rn = [
  "any-hover",
  "any-pointer",
  "aspect-ratio",
  "color",
  "color-gamut",
  "color-index",
  "device-aspect-ratio",
  "device-height",
  "device-width",
  "display-mode",
  "forced-colors",
  "grid",
  "height",
  "hover",
  "inverted-colors",
  "monochrome",
  "orientation",
  "overflow-block",
  "overflow-inline",
  "pointer",
  "prefers-color-scheme",
  "prefers-contrast",
  "prefers-reduced-motion",
  "prefers-reduced-transparency",
  "resolution",
  "scan",
  "scripting",
  "update",
  "width",
  // TODO: find a better solution?
  "min-width",
  "max-width",
  "min-height",
  "max-height"
].sort().reverse(), Cn = [
  "active",
  "any-link",
  "blank",
  "checked",
  "current",
  "default",
  "defined",
  "dir",
  // dir()
  "disabled",
  "drop",
  "empty",
  "enabled",
  "first",
  "first-child",
  "first-of-type",
  "fullscreen",
  "future",
  "focus",
  "focus-visible",
  "focus-within",
  "has",
  // has()
  "host",
  // host or host()
  "host-context",
  // host-context()
  "hover",
  "indeterminate",
  "in-range",
  "invalid",
  "is",
  // is()
  "lang",
  // lang()
  "last-child",
  "last-of-type",
  "left",
  "link",
  "local-link",
  "not",
  // not()
  "nth-child",
  // nth-child()
  "nth-col",
  // nth-col()
  "nth-last-child",
  // nth-last-child()
  "nth-last-col",
  // nth-last-col()
  "nth-last-of-type",
  //nth-last-of-type()
  "nth-of-type",
  //nth-of-type()
  "only-child",
  "only-of-type",
  "optional",
  "out-of-range",
  "past",
  "placeholder-shown",
  "read-only",
  "read-write",
  "required",
  "right",
  "root",
  "scope",
  "target",
  "target-within",
  "user-invalid",
  "valid",
  "visited",
  "where"
  // where()
].sort().reverse(), Mn = [
  "after",
  "backdrop",
  "before",
  "cue",
  "cue-region",
  "first-letter",
  "first-line",
  "grammar-error",
  "marker",
  "part",
  "placeholder",
  "selection",
  "slotted",
  "spelling-error"
].sort().reverse(), On = [
  "accent-color",
  "align-content",
  "align-items",
  "align-self",
  "alignment-baseline",
  "all",
  "anchor-name",
  "animation",
  "animation-composition",
  "animation-delay",
  "animation-direction",
  "animation-duration",
  "animation-fill-mode",
  "animation-iteration-count",
  "animation-name",
  "animation-play-state",
  "animation-range",
  "animation-range-end",
  "animation-range-start",
  "animation-timeline",
  "animation-timing-function",
  "appearance",
  "aspect-ratio",
  "backdrop-filter",
  "backface-visibility",
  "background",
  "background-attachment",
  "background-blend-mode",
  "background-clip",
  "background-color",
  "background-image",
  "background-origin",
  "background-position",
  "background-position-x",
  "background-position-y",
  "background-repeat",
  "background-size",
  "baseline-shift",
  "block-size",
  "border",
  "border-block",
  "border-block-color",
  "border-block-end",
  "border-block-end-color",
  "border-block-end-style",
  "border-block-end-width",
  "border-block-start",
  "border-block-start-color",
  "border-block-start-style",
  "border-block-start-width",
  "border-block-style",
  "border-block-width",
  "border-bottom",
  "border-bottom-color",
  "border-bottom-left-radius",
  "border-bottom-right-radius",
  "border-bottom-style",
  "border-bottom-width",
  "border-collapse",
  "border-color",
  "border-end-end-radius",
  "border-end-start-radius",
  "border-image",
  "border-image-outset",
  "border-image-repeat",
  "border-image-slice",
  "border-image-source",
  "border-image-width",
  "border-inline",
  "border-inline-color",
  "border-inline-end",
  "border-inline-end-color",
  "border-inline-end-style",
  "border-inline-end-width",
  "border-inline-start",
  "border-inline-start-color",
  "border-inline-start-style",
  "border-inline-start-width",
  "border-inline-style",
  "border-inline-width",
  "border-left",
  "border-left-color",
  "border-left-style",
  "border-left-width",
  "border-radius",
  "border-right",
  "border-right-color",
  "border-right-style",
  "border-right-width",
  "border-spacing",
  "border-start-end-radius",
  "border-start-start-radius",
  "border-style",
  "border-top",
  "border-top-color",
  "border-top-left-radius",
  "border-top-right-radius",
  "border-top-style",
  "border-top-width",
  "border-width",
  "bottom",
  "box-align",
  "box-decoration-break",
  "box-direction",
  "box-flex",
  "box-flex-group",
  "box-lines",
  "box-ordinal-group",
  "box-orient",
  "box-pack",
  "box-shadow",
  "box-sizing",
  "break-after",
  "break-before",
  "break-inside",
  "caption-side",
  "caret-color",
  "clear",
  "clip",
  "clip-path",
  "clip-rule",
  "color",
  "color-interpolation",
  "color-interpolation-filters",
  "color-profile",
  "color-rendering",
  "color-scheme",
  "column-count",
  "column-fill",
  "column-gap",
  "column-rule",
  "column-rule-color",
  "column-rule-style",
  "column-rule-width",
  "column-span",
  "column-width",
  "columns",
  "contain",
  "contain-intrinsic-block-size",
  "contain-intrinsic-height",
  "contain-intrinsic-inline-size",
  "contain-intrinsic-size",
  "contain-intrinsic-width",
  "container",
  "container-name",
  "container-type",
  "content",
  "content-visibility",
  "counter-increment",
  "counter-reset",
  "counter-set",
  "cue",
  "cue-after",
  "cue-before",
  "cursor",
  "cx",
  "cy",
  "direction",
  "display",
  "dominant-baseline",
  "empty-cells",
  "enable-background",
  "field-sizing",
  "fill",
  "fill-opacity",
  "fill-rule",
  "filter",
  "flex",
  "flex-basis",
  "flex-direction",
  "flex-flow",
  "flex-grow",
  "flex-shrink",
  "flex-wrap",
  "float",
  "flood-color",
  "flood-opacity",
  "flow",
  "font",
  "font-display",
  "font-family",
  "font-feature-settings",
  "font-kerning",
  "font-language-override",
  "font-optical-sizing",
  "font-palette",
  "font-size",
  "font-size-adjust",
  "font-smooth",
  "font-smoothing",
  "font-stretch",
  "font-style",
  "font-synthesis",
  "font-synthesis-position",
  "font-synthesis-small-caps",
  "font-synthesis-style",
  "font-synthesis-weight",
  "font-variant",
  "font-variant-alternates",
  "font-variant-caps",
  "font-variant-east-asian",
  "font-variant-emoji",
  "font-variant-ligatures",
  "font-variant-numeric",
  "font-variant-position",
  "font-variation-settings",
  "font-weight",
  "forced-color-adjust",
  "gap",
  "glyph-orientation-horizontal",
  "glyph-orientation-vertical",
  "grid",
  "grid-area",
  "grid-auto-columns",
  "grid-auto-flow",
  "grid-auto-rows",
  "grid-column",
  "grid-column-end",
  "grid-column-start",
  "grid-gap",
  "grid-row",
  "grid-row-end",
  "grid-row-start",
  "grid-template",
  "grid-template-areas",
  "grid-template-columns",
  "grid-template-rows",
  "hanging-punctuation",
  "height",
  "hyphenate-character",
  "hyphenate-limit-chars",
  "hyphens",
  "icon",
  "image-orientation",
  "image-rendering",
  "image-resolution",
  "ime-mode",
  "initial-letter",
  "initial-letter-align",
  "inline-size",
  "inset",
  "inset-area",
  "inset-block",
  "inset-block-end",
  "inset-block-start",
  "inset-inline",
  "inset-inline-end",
  "inset-inline-start",
  "isolation",
  "justify-content",
  "justify-items",
  "justify-self",
  "kerning",
  "left",
  "letter-spacing",
  "lighting-color",
  "line-break",
  "line-height",
  "line-height-step",
  "list-style",
  "list-style-image",
  "list-style-position",
  "list-style-type",
  "margin",
  "margin-block",
  "margin-block-end",
  "margin-block-start",
  "margin-bottom",
  "margin-inline",
  "margin-inline-end",
  "margin-inline-start",
  "margin-left",
  "margin-right",
  "margin-top",
  "margin-trim",
  "marker",
  "marker-end",
  "marker-mid",
  "marker-start",
  "marks",
  "mask",
  "mask-border",
  "mask-border-mode",
  "mask-border-outset",
  "mask-border-repeat",
  "mask-border-slice",
  "mask-border-source",
  "mask-border-width",
  "mask-clip",
  "mask-composite",
  "mask-image",
  "mask-mode",
  "mask-origin",
  "mask-position",
  "mask-repeat",
  "mask-size",
  "mask-type",
  "masonry-auto-flow",
  "math-depth",
  "math-shift",
  "math-style",
  "max-block-size",
  "max-height",
  "max-inline-size",
  "max-width",
  "min-block-size",
  "min-height",
  "min-inline-size",
  "min-width",
  "mix-blend-mode",
  "nav-down",
  "nav-index",
  "nav-left",
  "nav-right",
  "nav-up",
  "none",
  "normal",
  "object-fit",
  "object-position",
  "offset",
  "offset-anchor",
  "offset-distance",
  "offset-path",
  "offset-position",
  "offset-rotate",
  "opacity",
  "order",
  "orphans",
  "outline",
  "outline-color",
  "outline-offset",
  "outline-style",
  "outline-width",
  "overflow",
  "overflow-anchor",
  "overflow-block",
  "overflow-clip-margin",
  "overflow-inline",
  "overflow-wrap",
  "overflow-x",
  "overflow-y",
  "overlay",
  "overscroll-behavior",
  "overscroll-behavior-block",
  "overscroll-behavior-inline",
  "overscroll-behavior-x",
  "overscroll-behavior-y",
  "padding",
  "padding-block",
  "padding-block-end",
  "padding-block-start",
  "padding-bottom",
  "padding-inline",
  "padding-inline-end",
  "padding-inline-start",
  "padding-left",
  "padding-right",
  "padding-top",
  "page",
  "page-break-after",
  "page-break-before",
  "page-break-inside",
  "paint-order",
  "pause",
  "pause-after",
  "pause-before",
  "perspective",
  "perspective-origin",
  "place-content",
  "place-items",
  "place-self",
  "pointer-events",
  "position",
  "position-anchor",
  "position-visibility",
  "print-color-adjust",
  "quotes",
  "r",
  "resize",
  "rest",
  "rest-after",
  "rest-before",
  "right",
  "rotate",
  "row-gap",
  "ruby-align",
  "ruby-position",
  "scale",
  "scroll-behavior",
  "scroll-margin",
  "scroll-margin-block",
  "scroll-margin-block-end",
  "scroll-margin-block-start",
  "scroll-margin-bottom",
  "scroll-margin-inline",
  "scroll-margin-inline-end",
  "scroll-margin-inline-start",
  "scroll-margin-left",
  "scroll-margin-right",
  "scroll-margin-top",
  "scroll-padding",
  "scroll-padding-block",
  "scroll-padding-block-end",
  "scroll-padding-block-start",
  "scroll-padding-bottom",
  "scroll-padding-inline",
  "scroll-padding-inline-end",
  "scroll-padding-inline-start",
  "scroll-padding-left",
  "scroll-padding-right",
  "scroll-padding-top",
  "scroll-snap-align",
  "scroll-snap-stop",
  "scroll-snap-type",
  "scroll-timeline",
  "scroll-timeline-axis",
  "scroll-timeline-name",
  "scrollbar-color",
  "scrollbar-gutter",
  "scrollbar-width",
  "shape-image-threshold",
  "shape-margin",
  "shape-outside",
  "shape-rendering",
  "speak",
  "speak-as",
  "src",
  // @font-face
  "stop-color",
  "stop-opacity",
  "stroke",
  "stroke-dasharray",
  "stroke-dashoffset",
  "stroke-linecap",
  "stroke-linejoin",
  "stroke-miterlimit",
  "stroke-opacity",
  "stroke-width",
  "tab-size",
  "table-layout",
  "text-align",
  "text-align-all",
  "text-align-last",
  "text-anchor",
  "text-combine-upright",
  "text-decoration",
  "text-decoration-color",
  "text-decoration-line",
  "text-decoration-skip",
  "text-decoration-skip-ink",
  "text-decoration-style",
  "text-decoration-thickness",
  "text-emphasis",
  "text-emphasis-color",
  "text-emphasis-position",
  "text-emphasis-style",
  "text-indent",
  "text-justify",
  "text-orientation",
  "text-overflow",
  "text-rendering",
  "text-shadow",
  "text-size-adjust",
  "text-transform",
  "text-underline-offset",
  "text-underline-position",
  "text-wrap",
  "text-wrap-mode",
  "text-wrap-style",
  "timeline-scope",
  "top",
  "touch-action",
  "transform",
  "transform-box",
  "transform-origin",
  "transform-style",
  "transition",
  "transition-behavior",
  "transition-delay",
  "transition-duration",
  "transition-property",
  "transition-timing-function",
  "translate",
  "unicode-bidi",
  "user-modify",
  "user-select",
  "vector-effect",
  "vertical-align",
  "view-timeline",
  "view-timeline-axis",
  "view-timeline-inset",
  "view-timeline-name",
  "view-transition-name",
  "visibility",
  "voice-balance",
  "voice-duration",
  "voice-family",
  "voice-pitch",
  "voice-range",
  "voice-rate",
  "voice-stress",
  "voice-volume",
  "white-space",
  "white-space-collapse",
  "widows",
  "width",
  "will-change",
  "word-break",
  "word-spacing",
  "word-wrap",
  "writing-mode",
  "x",
  "y",
  "z-index",
  "zoom"
].sort().reverse();
function Ln(a) {
  const e = a.regex, n = An(a), r = { begin: /-(webkit|moz|ms|o)-(?=[a-z])/ }, o = "and or not only", c = /@-?\w[\w]*(-\w+)*/, b = "[a-zA-Z-][a-zA-Z0-9_-]*", h = [
    a.APOS_STRING_MODE,
    a.QUOTE_STRING_MODE
  ];
  return {
    name: "CSS",
    case_insensitive: !0,
    illegal: /[=|'\$]/,
    keywords: { keyframePosition: "from to" },
    classNameAliases: {
      // for visual continuity with `tag {}` and because we
      // don't have a great class for this?
      keyframePosition: "selector-tag"
    },
    contains: [
      n.BLOCK_COMMENT,
      r,
      // to recognize keyframe 40% etc which are outside the scope of our
      // attribute value mode
      n.CSS_NUMBER_MODE,
      {
        className: "selector-id",
        begin: /#[A-Za-z0-9_-]+/,
        relevance: 0
      },
      {
        className: "selector-class",
        begin: "\\." + b,
        relevance: 0
      },
      n.ATTRIBUTE_SELECTOR_MODE,
      {
        className: "selector-pseudo",
        variants: [
          { begin: ":(" + Cn.join("|") + ")" },
          { begin: ":(:)?(" + Mn.join("|") + ")" }
        ]
      },
      // we may actually need this (12/2020)
      // { // pseudo-selector params
      //   begin: /\(/,
      //   end: /\)/,
      //   contains: [ hljs.CSS_NUMBER_MODE ]
      // },
      n.CSS_VARIABLE,
      {
        className: "attribute",
        begin: "\\b(" + On.join("|") + ")\\b"
      },
      // attribute values
      {
        begin: /:/,
        end: /[;}{]/,
        contains: [
          n.BLOCK_COMMENT,
          n.HEXCOLOR,
          n.IMPORTANT,
          n.CSS_NUMBER_MODE,
          ...h,
          // needed to highlight these as strings and to avoid issues with
          // illegal characters that might be inside urls that would tigger the
          // languages illegal stack
          {
            begin: /(url|data-uri)\(/,
            end: /\)/,
            relevance: 0,
            // from keywords
            keywords: { built_in: "url data-uri" },
            contains: [
              ...h,
              {
                className: "string",
                // any character other than `)` as in `url()` will be the start
                // of a string, which ends with `)` (from the parent mode)
                begin: /[^)]/,
                endsWithParent: !0,
                excludeEnd: !0
              }
            ]
          },
          n.FUNCTION_DISPATCH
        ]
      },
      {
        begin: e.lookahead(/@/),
        end: "[{;]",
        relevance: 0,
        illegal: /:/,
        // break on Less variables @var: ...
        contains: [
          {
            className: "keyword",
            begin: c
          },
          {
            begin: /\s/,
            endsWithParent: !0,
            excludeEnd: !0,
            relevance: 0,
            keywords: {
              $pattern: /[a-z-]+/,
              keyword: o,
              attribute: Rn.join(" ")
            },
            contains: [
              {
                begin: /[a-z-]+(?=:)/,
                className: "attribute"
              },
              ...h,
              n.CSS_NUMBER_MODE
            ]
          }
        ]
      },
      {
        className: "selector-tag",
        begin: "\\b(" + Tn.join("|") + ")\\b"
      }
    ]
  };
}
function we(a) {
  const e = a.regex, n = e.concat(/[\p{L}_]/u, e.optional(/[\p{L}0-9_.-]*:/u), /[\p{L}0-9_.-]*/u), r = /[\p{L}0-9._:-]+/u, o = {
    className: "symbol",
    begin: /&[a-z]+;|&#[0-9]+;|&#x[a-f0-9]+;/
  }, c = {
    begin: /\s/,
    contains: [
      {
        className: "keyword",
        begin: /#?[a-z_][a-z1-9_-]+/,
        illegal: /\n/
      }
    ]
  }, b = a.inherit(c, {
    begin: /\(/,
    end: /\)/
  }), h = a.inherit(a.APOS_STRING_MODE, { className: "string" }), u = a.inherit(a.QUOTE_STRING_MODE, { className: "string" }), f = {
    endsWithParent: !0,
    illegal: /</,
    relevance: 0,
    contains: [
      {
        className: "attr",
        begin: r,
        relevance: 0
      },
      {
        begin: /=\s*/,
        relevance: 0,
        contains: [
          {
            className: "string",
            endsParent: !0,
            variants: [
              {
                begin: /"/,
                end: /"/,
                contains: [o]
              },
              {
                begin: /'/,
                end: /'/,
                contains: [o]
              },
              { begin: /[^\s"'=<>`]+/ }
            ]
          }
        ]
      }
    ]
  };
  return {
    name: "HTML, XML",
    aliases: [
      "html",
      "xhtml",
      "rss",
      "atom",
      "xjb",
      "xsd",
      "xsl",
      "plist",
      "wsf",
      "svg"
    ],
    case_insensitive: !0,
    unicodeRegex: !0,
    contains: [
      {
        className: "meta",
        begin: /<![a-z]/,
        end: />/,
        relevance: 10,
        contains: [
          c,
          u,
          h,
          b,
          {
            begin: /\[/,
            end: /\]/,
            contains: [
              {
                className: "meta",
                begin: /<![a-z]/,
                end: />/,
                contains: [
                  c,
                  b,
                  u,
                  h
                ]
              }
            ]
          }
        ]
      },
      a.COMMENT(
        /<!--/,
        /-->/,
        { relevance: 10 }
      ),
      {
        begin: /<!\[CDATA\[/,
        end: /\]\]>/,
        relevance: 10
      },
      o,
      // xml processing instructions
      {
        className: "meta",
        end: /\?>/,
        variants: [
          {
            begin: /<\?xml/,
            relevance: 10,
            contains: [
              u
            ]
          },
          {
            begin: /<\?[a-z][a-z0-9]+/
          }
        ]
      },
      {
        className: "tag",
        /*
        The lookahead pattern (?=...) ensures that 'begin' only matches
        'style' as a single word, followed by a whitespace or an
        ending bracket.
        */
        begin: /<style(?=\s|>)/,
        end: />/,
        keywords: { name: "style" },
        contains: [f],
        starts: {
          end: /<\/style>/,
          returnEnd: !0,
          subLanguage: [
            "css",
            "xml"
          ]
        }
      },
      {
        className: "tag",
        // See the comment in the style tag about the lookahead pattern
        begin: /<script(?=\s|>)/,
        end: />/,
        keywords: { name: "script" },
        contains: [f],
        starts: {
          end: /<\/script>/,
          returnEnd: !0,
          subLanguage: [
            "javascript",
            "handlebars",
            "xml"
          ]
        }
      },
      // we need this for now for jSX
      {
        className: "tag",
        begin: /<>|<\/>/
      },
      // open tag
      {
        className: "tag",
        begin: e.concat(
          /</,
          e.lookahead(e.concat(
            n,
            // tag/
            // tag
            // tag ...
            e.either(/\/>/, />/, /\s/)
          ))
        ),
        end: /\/?>/,
        contains: [
          {
            className: "name",
            begin: n,
            relevance: 0,
            starts: f
          }
        ]
      },
      // close tag
      {
        className: "tag",
        begin: e.concat(
          /<\//,
          e.lookahead(e.concat(
            n,
            />/
          ))
        ),
        contains: [
          {
            className: "name",
            begin: n,
            relevance: 0
          },
          {
            begin: />/,
            relevance: 0,
            endsParent: !0
          }
        ]
      }
    ]
  };
}
function In(a) {
  const e = {
    className: "attr",
    begin: /"(\\.|[^\\"\r\n])*"(?=\s*:)/,
    relevance: 1.01
  }, n = {
    match: /[{}[\],:]/,
    className: "punctuation",
    relevance: 0
  }, r = [
    "true",
    "false",
    "null"
  ], o = {
    scope: "literal",
    beginKeywords: r.join(" ")
  };
  return {
    name: "JSON",
    aliases: ["jsonc"],
    keywords: {
      literal: r
    },
    contains: [
      e,
      n,
      a.QUOTE_STRING_MODE,
      o,
      a.C_NUMBER_MODE,
      a.C_LINE_COMMENT_MODE,
      a.C_BLOCK_COMMENT_MODE
    ],
    illegal: "\\S"
  };
}
function ft(a) {
  const e = "true false yes no null", n = "[\\w#;/?:@&=+$,.~*'()[\\]]+", r = {
    className: "attr",
    variants: [
      // added brackets support and special char support
      { begin: /[\w*@][\w*@ :()\./-]*:(?=[ \t]|$)/ },
      {
        // double quoted keys - with brackets and special char support
        begin: /"[\w*@][\w*@ :()\./-]*":(?=[ \t]|$)/
      },
      {
        // single quoted keys - with brackets and special char support
        begin: /'[\w*@][\w*@ :()\./-]*':(?=[ \t]|$)/
      }
    ]
  }, o = {
    className: "template-variable",
    variants: [
      {
        // jinja templates Ansible
        begin: /\{\{/,
        end: /\}\}/
      },
      {
        // Ruby i18n
        begin: /%\{/,
        end: /\}/
      }
    ]
  }, c = {
    className: "string",
    relevance: 0,
    begin: /'/,
    end: /'/,
    contains: [
      {
        match: /''/,
        scope: "char.escape",
        relevance: 0
      }
    ]
  }, b = {
    className: "string",
    relevance: 0,
    variants: [
      {
        begin: /"/,
        end: /"/
      },
      { begin: /\S+/ }
    ],
    contains: [
      a.BACKSLASH_ESCAPE,
      o
    ]
  }, h = a.inherit(b, { variants: [
    {
      begin: /'/,
      end: /'/,
      contains: [
        {
          begin: /''/,
          relevance: 0
        }
      ]
    },
    {
      begin: /"/,
      end: /"/
    },
    { begin: /[^\s,{}[\]]+/ }
  ] }), x = {
    className: "number",
    begin: "\\b" + "[0-9]{4}(-[0-9][0-9]){0,2}" + "([Tt \\t][0-9][0-9]?(:[0-9][0-9]){2})?" + "(\\.[0-9]*)?" + "([ \\t])*(Z|[-+][0-9][0-9]?(:[0-9][0-9])?)?" + "\\b"
  }, A = {
    end: ",",
    endsWithParent: !0,
    excludeEnd: !0,
    keywords: e,
    relevance: 0
  }, M = {
    begin: /\{/,
    end: /\}/,
    contains: [A],
    illegal: "\\n",
    relevance: 0
  }, N = {
    begin: "\\[",
    end: "\\]",
    contains: [A],
    illegal: "\\n",
    relevance: 0
  }, B = [
    r,
    {
      className: "meta",
      begin: "^---\\s*$",
      relevance: 10
    },
    {
      // multi line string
      // Blocks start with a | or  followed by a newline
      //
      // Indentation of subsequent lines must be the same to
      // be considered part of the block
      className: "string",
      begin: "[\\|>]([1-9]?[+-])?[ ]*\\n( +)[^ ][^\\n]*\\n(\\2[^\\n]+\\n?)*"
    },
    {
      // Ruby/Rails erb
      begin: "<%[%=-]?",
      end: "[%-]?%>",
      subLanguage: "ruby",
      excludeBegin: !0,
      excludeEnd: !0,
      relevance: 0
    },
    {
      // named tags
      className: "type",
      begin: "!\\w+!" + n
    },
    // https://yaml.org/spec/1.2/spec.html#id2784064
    {
      // verbatim tags
      className: "type",
      begin: "!<" + n + ">"
    },
    {
      // primary tags
      className: "type",
      begin: "!" + n
    },
    {
      // secondary tags
      className: "type",
      begin: "!!" + n
    },
    {
      // fragment id &ref
      className: "meta",
      begin: "&" + a.UNDERSCORE_IDENT_RE + "$"
    },
    {
      // fragment reference *ref
      className: "meta",
      begin: "\\*" + a.UNDERSCORE_IDENT_RE + "$"
    },
    {
      // array listing
      className: "bullet",
      // TODO: remove |$ hack when we have proper look-ahead support
      begin: "-(?=[ ]|$)",
      relevance: 0
    },
    a.HASH_COMMENT_MODE,
    {
      beginKeywords: e,
      keywords: { literal: e }
    },
    x,
    // numbers are any valid C-style number that
    // sit isolated from other words
    {
      className: "number",
      begin: a.C_NUMBER_RE + "\\b",
      relevance: 0
    },
    M,
    N,
    c,
    b
  ], $ = [...B];
  return $.pop(), $.push(h), A.contains = $, {
    name: "YAML",
    case_insensitive: !0,
    aliases: ["yml"],
    contains: B
  };
}
function $n(a) {
  const e = a.regex, n = /(?![A-Za-z0-9])(?![$])/, r = e.concat(
    /[a-zA-Z_\x7f-\xff][a-zA-Z0-9_\x7f-\xff]*/,
    n
  ), o = e.concat(
    /(\\?[A-Z][a-z0-9_\x7f-\xff]+|\\?[A-Z]+(?=[A-Z][a-z0-9_\x7f-\xff])){1,}/,
    n
  ), c = e.concat(
    /[A-Z]+/,
    n
  ), b = {
    scope: "variable",
    match: "\\$+" + r
  }, h = {
    scope: "meta",
    variants: [
      { begin: /<\?php/, relevance: 10 },
      // boost for obvious PHP
      { begin: /<\?=/ },
      // less relevant per PSR-1 which says not to use short-tags
      { begin: /<\?/, relevance: 0.1 },
      { begin: /\?>/ }
      // end php tag
    ]
  }, u = {
    scope: "subst",
    variants: [
      { begin: /\$\w+/ },
      {
        begin: /\{\$/,
        end: /\}/
      }
    ]
  }, f = a.inherit(a.APOS_STRING_MODE, { illegal: null }), E = a.inherit(a.QUOTE_STRING_MODE, {
    illegal: null,
    contains: a.QUOTE_STRING_MODE.contains.concat(u)
  }), S = {
    begin: /<<<[ \t]*(?:(\w+)|"(\w+)")\n/,
    end: /[ \t]*(\w+)\b/,
    contains: a.QUOTE_STRING_MODE.contains.concat(u),
    "on:begin": (D, U) => {
      U.data._beginMatch = D[1] || D[2];
    },
    "on:end": (D, U) => {
      U.data._beginMatch !== D[1] && U.ignoreMatch();
    }
  }, x = a.END_SAME_AS_BEGIN({
    begin: /<<<[ \t]*'(\w+)'\n/,
    end: /[ \t]*(\w+)\b/
  }), A = `[ 	
]`, M = {
    scope: "string",
    variants: [
      E,
      f,
      S,
      x
    ]
  }, N = {
    scope: "number",
    variants: [
      { begin: "\\b0[bB][01]+(?:_[01]+)*\\b" },
      // Binary w/ underscore support
      { begin: "\\b0[oO][0-7]+(?:_[0-7]+)*\\b" },
      // Octals w/ underscore support
      { begin: "\\b0[xX][\\da-fA-F]+(?:_[\\da-fA-F]+)*\\b" },
      // Hex w/ underscore support
      // Decimals w/ underscore support, with optional fragments and scientific exponent (e) suffix.
      { begin: "(?:\\b\\d+(?:_\\d+)*(\\.(?:\\d+(?:_\\d+)*))?|\\B\\.\\d+)(?:[eE][+-]?\\d+)?" }
    ],
    relevance: 0
  }, B = [
    "false",
    "null",
    "true"
  ], $ = [
    // Magic constants:
    // https://www.php.net/manual/en/language.constants.predefined.php
    "__CLASS__",
    "__DIR__",
    "__FILE__",
    "__FUNCTION__",
    "__COMPILER_HALT_OFFSET__",
    "__LINE__",
    "__METHOD__",
    "__NAMESPACE__",
    "__TRAIT__",
    // Function that look like language construct or language construct that look like function:
    // List of keywords that may not require parenthesis
    "die",
    "echo",
    "exit",
    "include",
    "include_once",
    "print",
    "require",
    "require_once",
    // These are not language construct (function) but operate on the currently-executing function and can access the current symbol table
    // 'compact extract func_get_arg func_get_args func_num_args get_called_class get_parent_class ' +
    // Other keywords:
    // https://www.php.net/manual/en/reserved.php
    // https://www.php.net/manual/en/language.types.type-juggling.php
    "array",
    "abstract",
    "and",
    "as",
    "binary",
    "bool",
    "boolean",
    "break",
    "callable",
    "case",
    "catch",
    "class",
    "clone",
    "const",
    "continue",
    "declare",
    "default",
    "do",
    "double",
    "else",
    "elseif",
    "empty",
    "enddeclare",
    "endfor",
    "endforeach",
    "endif",
    "endswitch",
    "endwhile",
    "enum",
    "eval",
    "extends",
    "final",
    "finally",
    "float",
    "for",
    "foreach",
    "from",
    "global",
    "goto",
    "if",
    "implements",
    "instanceof",
    "insteadof",
    "int",
    "integer",
    "interface",
    "isset",
    "iterable",
    "list",
    "match|0",
    "mixed",
    "new",
    "never",
    "object",
    "or",
    "private",
    "protected",
    "public",
    "readonly",
    "real",
    "return",
    "string",
    "switch",
    "throw",
    "trait",
    "try",
    "unset",
    "use",
    "var",
    "void",
    "while",
    "xor",
    "yield"
  ], P = [
    // Standard PHP library:
    // https://www.php.net/manual/en/book.spl.php
    "Error|0",
    "AppendIterator",
    "ArgumentCountError",
    "ArithmeticError",
    "ArrayIterator",
    "ArrayObject",
    "AssertionError",
    "BadFunctionCallException",
    "BadMethodCallException",
    "CachingIterator",
    "CallbackFilterIterator",
    "CompileError",
    "Countable",
    "DirectoryIterator",
    "DivisionByZeroError",
    "DomainException",
    "EmptyIterator",
    "ErrorException",
    "Exception",
    "FilesystemIterator",
    "FilterIterator",
    "GlobIterator",
    "InfiniteIterator",
    "InvalidArgumentException",
    "IteratorIterator",
    "LengthException",
    "LimitIterator",
    "LogicException",
    "MultipleIterator",
    "NoRewindIterator",
    "OutOfBoundsException",
    "OutOfRangeException",
    "OuterIterator",
    "OverflowException",
    "ParentIterator",
    "ParseError",
    "RangeException",
    "RecursiveArrayIterator",
    "RecursiveCachingIterator",
    "RecursiveCallbackFilterIterator",
    "RecursiveDirectoryIterator",
    "RecursiveFilterIterator",
    "RecursiveIterator",
    "RecursiveIteratorIterator",
    "RecursiveRegexIterator",
    "RecursiveTreeIterator",
    "RegexIterator",
    "RuntimeException",
    "SeekableIterator",
    "SplDoublyLinkedList",
    "SplFileInfo",
    "SplFileObject",
    "SplFixedArray",
    "SplHeap",
    "SplMaxHeap",
    "SplMinHeap",
    "SplObjectStorage",
    "SplObserver",
    "SplPriorityQueue",
    "SplQueue",
    "SplStack",
    "SplSubject",
    "SplTempFileObject",
    "TypeError",
    "UnderflowException",
    "UnexpectedValueException",
    "UnhandledMatchError",
    // Reserved interfaces:
    // https://www.php.net/manual/en/reserved.interfaces.php
    "ArrayAccess",
    "BackedEnum",
    "Closure",
    "Fiber",
    "Generator",
    "Iterator",
    "IteratorAggregate",
    "Serializable",
    "Stringable",
    "Throwable",
    "Traversable",
    "UnitEnum",
    "WeakReference",
    "WeakMap",
    // Reserved classes:
    // https://www.php.net/manual/en/reserved.classes.php
    "Directory",
    "__PHP_Incomplete_Class",
    "parent",
    "php_user_filter",
    "self",
    "static",
    "stdClass"
  ], Q = {
    keyword: $,
    literal: ((D) => {
      const U = [];
      return D.forEach((Y) => {
        U.push(Y), Y.toLowerCase() === Y ? U.push(Y.toUpperCase()) : U.push(Y.toLowerCase());
      }), U;
    })(B),
    built_in: P
  }, G = (D) => D.map((U) => U.replace(/\|\d+$/, "")), j = { variants: [
    {
      match: [
        /new/,
        e.concat(A, "+"),
        // to prevent built ins from being confused as the class constructor call
        e.concat("(?!", G(P).join("\\b|"), "\\b)"),
        o
      ],
      scope: {
        1: "keyword",
        4: "title.class"
      }
    }
  ] }, re = e.concat(r, "\\b(?!\\()"), q = { variants: [
    {
      match: [
        e.concat(
          /::/,
          e.lookahead(/(?!class\b)/)
        ),
        re
      ],
      scope: { 2: "variable.constant" }
    },
    {
      match: [
        /::/,
        /class/
      ],
      scope: { 2: "variable.language" }
    },
    {
      match: [
        o,
        e.concat(
          /::/,
          e.lookahead(/(?!class\b)/)
        ),
        re
      ],
      scope: {
        1: "title.class",
        3: "variable.constant"
      }
    },
    {
      match: [
        o,
        e.concat(
          "::",
          e.lookahead(/(?!class\b)/)
        )
      ],
      scope: { 1: "title.class" }
    },
    {
      match: [
        o,
        /::/,
        /class/
      ],
      scope: {
        1: "title.class",
        3: "variable.language"
      }
    }
  ] }, se = {
    scope: "attr",
    match: e.concat(r, e.lookahead(":"), e.lookahead(/(?!::)/))
  }, oe = {
    relevance: 0,
    begin: /\(/,
    end: /\)/,
    keywords: Q,
    contains: [
      se,
      b,
      q,
      a.C_BLOCK_COMMENT_MODE,
      M,
      N,
      j
    ]
  }, ie = {
    relevance: 0,
    match: [
      /\b/,
      // to prevent keywords from being confused as the function title
      e.concat("(?!fn\\b|function\\b|", G($).join("\\b|"), "|", G(P).join("\\b|"), "\\b)"),
      r,
      e.concat(A, "*"),
      e.lookahead(/(?=\()/)
    ],
    scope: { 3: "title.function.invoke" },
    contains: [oe]
  };
  oe.contains.push(ie);
  const ce = [
    se,
    q,
    a.C_BLOCK_COMMENT_MODE,
    M,
    N,
    j
  ], te = {
    begin: e.concat(
      /#\[\s*\\?/,
      e.either(
        o,
        c
      )
    ),
    beginScope: "meta",
    end: /]/,
    endScope: "meta",
    keywords: {
      literal: B,
      keyword: [
        "new",
        "array"
      ]
    },
    contains: [
      {
        begin: /\[/,
        end: /]/,
        keywords: {
          literal: B,
          keyword: [
            "new",
            "array"
          ]
        },
        contains: [
          "self",
          ...ce
        ]
      },
      ...ce,
      {
        scope: "meta",
        variants: [
          { match: o },
          { match: c }
        ]
      }
    ]
  };
  return {
    case_insensitive: !1,
    keywords: Q,
    contains: [
      te,
      a.HASH_COMMENT_MODE,
      a.COMMENT("//", "$"),
      a.COMMENT(
        "/\\*",
        "\\*/",
        { contains: [
          {
            scope: "doctag",
            match: "@[A-Za-z]+"
          }
        ] }
      ),
      {
        match: /__halt_compiler\(\);/,
        keywords: "__halt_compiler",
        starts: {
          scope: "comment",
          end: a.MATCH_NOTHING_RE,
          contains: [
            {
              match: /\?>/,
              scope: "meta",
              endsParent: !0
            }
          ]
        }
      },
      h,
      {
        scope: "variable.language",
        match: /\$this\b/
      },
      b,
      ie,
      q,
      {
        match: [
          /const/,
          /\s/,
          r
        ],
        scope: {
          1: "keyword",
          3: "variable.constant"
        }
      },
      j,
      {
        scope: "function",
        relevance: 0,
        beginKeywords: "fn function",
        end: /[;{]/,
        excludeEnd: !0,
        illegal: "[$%\\[]",
        contains: [
          { beginKeywords: "use" },
          a.UNDERSCORE_TITLE_MODE,
          {
            begin: "=>",
            // No markup, just a relevance booster
            endsParent: !0
          },
          {
            scope: "params",
            begin: "\\(",
            end: "\\)",
            excludeBegin: !0,
            excludeEnd: !0,
            keywords: Q,
            contains: [
              "self",
              te,
              b,
              q,
              a.C_BLOCK_COMMENT_MODE,
              M,
              N
            ]
          }
        ]
      },
      {
        scope: "class",
        variants: [
          {
            beginKeywords: "enum",
            illegal: /[($"]/
          },
          {
            beginKeywords: "class interface trait",
            illegal: /[:($"]/
          }
        ],
        relevance: 0,
        end: /\{/,
        excludeEnd: !0,
        contains: [
          { beginKeywords: "extends implements" },
          a.UNDERSCORE_TITLE_MODE
        ]
      },
      // both use and namespace still use "old style" rules (vs multi-match)
      // because the namespace name can include `\` and we still want each
      // element to be treated as its own *individual* title
      {
        beginKeywords: "namespace",
        relevance: 0,
        end: ";",
        illegal: /[.']/,
        contains: [a.inherit(a.UNDERSCORE_TITLE_MODE, { scope: "title.class" })]
      },
      {
        beginKeywords: "use",
        relevance: 0,
        end: ";",
        contains: [
          // TODO: title.function vs title.class
          {
            match: /\b(as|const|function)\b/,
            scope: "keyword"
          },
          // TODO: could be title.class or title.function
          a.UNDERSCORE_TITLE_MODE
        ]
      },
      M,
      N
    ]
  };
}
function Bn(a) {
  const e = a.regex, n = "HTTP/([32]|1\\.[01])", r = /[A-Za-z][A-Za-z0-9-]*/, o = {
    className: "attribute",
    begin: e.concat("^", r, "(?=\\:\\s)"),
    starts: { contains: [
      {
        className: "punctuation",
        begin: /: /,
        relevance: 0,
        starts: {
          end: "$",
          relevance: 0
        }
      }
    ] }
  }, c = [
    o,
    {
      begin: "\\n\\n",
      starts: {
        subLanguage: [],
        endsWithParent: !0
      }
    }
  ];
  return {
    name: "HTTP",
    aliases: ["https"],
    illegal: /\S/,
    contains: [
      // response
      {
        begin: "^(?=" + n + " \\d{3})",
        end: /$/,
        contains: [
          {
            className: "meta",
            begin: n
          },
          {
            className: "number",
            begin: "\\b\\d{3}\\b"
          }
        ],
        starts: {
          end: /\b\B/,
          illegal: /\S/,
          contains: c
        }
      },
      // request
      {
        begin: "(?=^[A-Z]+ (.*?) " + n + "$)",
        end: /$/,
        contains: [
          {
            className: "string",
            begin: " ",
            end: " ",
            excludeBegin: !0,
            excludeEnd: !0
          },
          {
            className: "meta",
            begin: n
          },
          {
            className: "keyword",
            begin: "[A-Z]+"
          }
        ],
        starts: {
          end: /\b\B/,
          illegal: /\S/,
          contains: c
        }
      },
      // to allow headers to work even without a preamble
      a.inherit(o, { relevance: 0 })
    ]
  };
}
function $e(a) {
  return {
    name: "Plain text",
    aliases: [
      "text",
      "txt"
    ],
    disableAutodetect: !0
  };
}
function Dn(a) {
  const e = a.regex;
  return {
    name: "Diff",
    aliases: ["patch"],
    contains: [
      {
        className: "meta",
        relevance: 10,
        match: e.either(
          /^@@ +-\d+,\d+ +\+\d+,\d+ +@@/,
          /^\*\*\* +\d+,\d+ +\*\*\*\*$/,
          /^--- +\d+,\d+ +----$/
        )
      },
      {
        className: "comment",
        variants: [
          {
            begin: e.either(
              /Index: /,
              /^index/,
              /={3,}/,
              /^-{3}/,
              /^\*{3} /,
              /^\+{3}/,
              /^diff --git/
            ),
            end: /$/
          },
          { match: /^\*{15}$/ }
        ]
      },
      {
        className: "addition",
        begin: /^\+/,
        end: /$/
      },
      {
        className: "deletion",
        begin: /^-/,
        end: /$/
      },
      {
        className: "addition",
        begin: /^!/,
        end: /$/
      }
    ]
  };
}
function Be(a) {
  const e = a.regex, n = {}, r = {
    begin: /\$\{/,
    end: /\}/,
    contains: [
      "self",
      {
        begin: /:-/,
        contains: [n]
      }
      // default values
    ]
  };
  Object.assign(n, {
    className: "variable",
    variants: [
      { begin: e.concat(
        /\$[\w\d#@][\w\d_]*/,
        // negative look-ahead tries to avoid matching patterns that are not
        // Perl at all like $ident$, @ident@, etc.
        "(?![\\w\\d])(?![$])"
      ) },
      r
    ]
  });
  const o = {
    className: "subst",
    begin: /\$\(/,
    end: /\)/,
    contains: [a.BACKSLASH_ESCAPE]
  }, c = a.inherit(
    a.COMMENT(),
    {
      match: [
        /(^|\s)/,
        /#.*$/
      ],
      scope: {
        2: "comment"
      }
    }
  ), b = {
    begin: /<<-?\s*(?=\w+)/,
    starts: { contains: [
      a.END_SAME_AS_BEGIN({
        begin: /(\w+)/,
        end: /(\w+)/,
        className: "string"
      })
    ] }
  }, h = {
    className: "string",
    begin: /"/,
    end: /"/,
    contains: [
      a.BACKSLASH_ESCAPE,
      n,
      o
    ]
  };
  o.contains.push(h);
  const u = {
    match: /\\"/
  }, f = {
    className: "string",
    begin: /'/,
    end: /'/
  }, E = {
    match: /\\'/
  }, S = {
    begin: /\$?\(\(/,
    end: /\)\)/,
    contains: [
      {
        begin: /\d+#[0-9a-f]+/,
        className: "number"
      },
      a.NUMBER_MODE,
      n
    ]
  }, x = [
    "fish",
    "bash",
    "zsh",
    "sh",
    "csh",
    "ksh",
    "tcsh",
    "dash",
    "scsh"
  ], A = a.SHEBANG({
    binary: `(${x.join("|")})`,
    relevance: 10
  }), M = {
    className: "function",
    begin: /\w[\w\d_]*\s*\(\s*\)\s*\{/,
    returnBegin: !0,
    contains: [a.inherit(a.TITLE_MODE, { begin: /\w[\w\d_]*/ })],
    relevance: 0
  }, N = [
    "if",
    "then",
    "else",
    "elif",
    "fi",
    "time",
    "for",
    "while",
    "until",
    "in",
    "do",
    "done",
    "case",
    "esac",
    "coproc",
    "function",
    "select"
  ], B = [
    "true",
    "false"
  ], $ = { match: /(\/[a-z._-]+)+/ }, P = [
    "break",
    "cd",
    "continue",
    "eval",
    "exec",
    "exit",
    "export",
    "getopts",
    "hash",
    "pwd",
    "readonly",
    "return",
    "shift",
    "test",
    "times",
    "trap",
    "umask",
    "unset"
  ], W = [
    "alias",
    "bind",
    "builtin",
    "caller",
    "command",
    "declare",
    "echo",
    "enable",
    "help",
    "let",
    "local",
    "logout",
    "mapfile",
    "printf",
    "read",
    "readarray",
    "source",
    "sudo",
    "type",
    "typeset",
    "ulimit",
    "unalias"
  ], Q = [
    "autoload",
    "bg",
    "bindkey",
    "bye",
    "cap",
    "chdir",
    "clone",
    "comparguments",
    "compcall",
    "compctl",
    "compdescribe",
    "compfiles",
    "compgroups",
    "compquote",
    "comptags",
    "comptry",
    "compvalues",
    "dirs",
    "disable",
    "disown",
    "echotc",
    "echoti",
    "emulate",
    "fc",
    "fg",
    "float",
    "functions",
    "getcap",
    "getln",
    "history",
    "integer",
    "jobs",
    "kill",
    "limit",
    "log",
    "noglob",
    "popd",
    "print",
    "pushd",
    "pushln",
    "rehash",
    "sched",
    "setcap",
    "setopt",
    "stat",
    "suspend",
    "ttyctl",
    "unfunction",
    "unhash",
    "unlimit",
    "unsetopt",
    "vared",
    "wait",
    "whence",
    "where",
    "which",
    "zcompile",
    "zformat",
    "zftp",
    "zle",
    "zmodload",
    "zparseopts",
    "zprof",
    "zpty",
    "zregexparse",
    "zsocket",
    "zstyle",
    "ztcp"
  ], G = [
    "chcon",
    "chgrp",
    "chown",
    "chmod",
    "cp",
    "dd",
    "df",
    "dir",
    "dircolors",
    "ln",
    "ls",
    "mkdir",
    "mkfifo",
    "mknod",
    "mktemp",
    "mv",
    "realpath",
    "rm",
    "rmdir",
    "shred",
    "sync",
    "touch",
    "truncate",
    "vdir",
    "b2sum",
    "base32",
    "base64",
    "cat",
    "cksum",
    "comm",
    "csplit",
    "cut",
    "expand",
    "fmt",
    "fold",
    "head",
    "join",
    "md5sum",
    "nl",
    "numfmt",
    "od",
    "paste",
    "ptx",
    "pr",
    "sha1sum",
    "sha224sum",
    "sha256sum",
    "sha384sum",
    "sha512sum",
    "shuf",
    "sort",
    "split",
    "sum",
    "tac",
    "tail",
    "tr",
    "tsort",
    "unexpand",
    "uniq",
    "wc",
    "arch",
    "basename",
    "chroot",
    "date",
    "dirname",
    "du",
    "echo",
    "env",
    "expr",
    "factor",
    // "false", // keyword literal already
    "groups",
    "hostid",
    "id",
    "link",
    "logname",
    "nice",
    "nohup",
    "nproc",
    "pathchk",
    "pinky",
    "printenv",
    "printf",
    "pwd",
    "readlink",
    "runcon",
    "seq",
    "sleep",
    "stat",
    "stdbuf",
    "stty",
    "tee",
    "test",
    "timeout",
    // "true", // keyword literal already
    "tty",
    "uname",
    "unlink",
    "uptime",
    "users",
    "who",
    "whoami",
    "yes"
  ];
  return {
    name: "Bash",
    aliases: [
      "sh",
      "zsh"
    ],
    keywords: {
      $pattern: /\b[a-z][a-z0-9._-]+\b/,
      keyword: N,
      literal: B,
      built_in: [
        ...P,
        ...W,
        // Shell modifiers
        "set",
        "shopt",
        ...Q,
        ...G
      ]
    },
    contains: [
      A,
      // to catch known shells and boost relevancy
      a.SHEBANG(),
      // to catch unknown shells but still highlight the shebang
      M,
      S,
      c,
      b,
      $,
      h,
      u,
      f,
      E,
      n
    ]
  };
}
function mt(a) {
  const e = a.regex, n = new RegExp("[\\p{XID_Start}_]\\p{XID_Continue}*", "u"), r = [
    "and",
    "as",
    "assert",
    "async",
    "await",
    "break",
    "case",
    "class",
    "continue",
    "def",
    "del",
    "elif",
    "else",
    "except",
    "finally",
    "for",
    "from",
    "global",
    "if",
    "import",
    "in",
    "is",
    "lambda",
    "match",
    "nonlocal|10",
    "not",
    "or",
    "pass",
    "raise",
    "return",
    "try",
    "while",
    "with",
    "yield"
  ], h = {
    $pattern: /[A-Za-z]\w+|__\w+__/,
    keyword: r,
    built_in: [
      "__import__",
      "abs",
      "all",
      "any",
      "ascii",
      "bin",
      "bool",
      "breakpoint",
      "bytearray",
      "bytes",
      "callable",
      "chr",
      "classmethod",
      "compile",
      "complex",
      "delattr",
      "dict",
      "dir",
      "divmod",
      "enumerate",
      "eval",
      "exec",
      "filter",
      "float",
      "format",
      "frozenset",
      "getattr",
      "globals",
      "hasattr",
      "hash",
      "help",
      "hex",
      "id",
      "input",
      "int",
      "isinstance",
      "issubclass",
      "iter",
      "len",
      "list",
      "locals",
      "map",
      "max",
      "memoryview",
      "min",
      "next",
      "object",
      "oct",
      "open",
      "ord",
      "pow",
      "print",
      "property",
      "range",
      "repr",
      "reversed",
      "round",
      "set",
      "setattr",
      "slice",
      "sorted",
      "staticmethod",
      "str",
      "sum",
      "super",
      "tuple",
      "type",
      "vars",
      "zip"
    ],
    literal: [
      "__debug__",
      "Ellipsis",
      "False",
      "None",
      "NotImplemented",
      "True"
    ],
    type: [
      "Any",
      "Callable",
      "Coroutine",
      "Dict",
      "List",
      "Literal",
      "Generic",
      "Optional",
      "Sequence",
      "Set",
      "Tuple",
      "Type",
      "Union"
    ]
  }, u = {
    className: "meta",
    begin: /^(>>>|\.\.\.) /
  }, f = {
    className: "subst",
    begin: /\{/,
    end: /\}/,
    keywords: h,
    illegal: /#/
  }, E = {
    begin: /\{\{/,
    relevance: 0
  }, S = {
    className: "string",
    contains: [a.BACKSLASH_ESCAPE],
    variants: [
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?'''/,
        end: /'''/,
        contains: [
          a.BACKSLASH_ESCAPE,
          u
        ],
        relevance: 10
      },
      {
        begin: /([uU]|[bB]|[rR]|[bB][rR]|[rR][bB])?"""/,
        end: /"""/,
        contains: [
          a.BACKSLASH_ESCAPE,
          u
        ],
        relevance: 10
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])'''/,
        end: /'''/,
        contains: [
          a.BACKSLASH_ESCAPE,
          u,
          E,
          f
        ]
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])"""/,
        end: /"""/,
        contains: [
          a.BACKSLASH_ESCAPE,
          u,
          E,
          f
        ]
      },
      {
        begin: /([uU]|[rR])'/,
        end: /'/,
        relevance: 10
      },
      {
        begin: /([uU]|[rR])"/,
        end: /"/,
        relevance: 10
      },
      {
        begin: /([bB]|[bB][rR]|[rR][bB])'/,
        end: /'/
      },
      {
        begin: /([bB]|[bB][rR]|[rR][bB])"/,
        end: /"/
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])'/,
        end: /'/,
        contains: [
          a.BACKSLASH_ESCAPE,
          E,
          f
        ]
      },
      {
        begin: /([fF][rR]|[rR][fF]|[fF])"/,
        end: /"/,
        contains: [
          a.BACKSLASH_ESCAPE,
          E,
          f
        ]
      },
      a.APOS_STRING_MODE,
      a.QUOTE_STRING_MODE
    ]
  }, x = "[0-9](_?[0-9])*", A = `(\\b(${x}))?\\.(${x})|\\b(${x})\\.`, M = `\\b|${r.join("|")}`, N = {
    className: "number",
    relevance: 0,
    variants: [
      // exponentfloat, pointfloat
      // https://docs.python.org/3.9/reference/lexical_analysis.html#floating-point-literals
      // optionally imaginary
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      // Note: no leading \b because floats can start with a decimal point
      // and we don't want to mishandle e.g. `fn(.5)`,
      // no trailing \b for pointfloat because it can end with a decimal point
      // and we don't want to mishandle e.g. `0..hex()`; this should be safe
      // because both MUST contain a decimal point and so cannot be confused with
      // the interior part of an identifier
      {
        begin: `(\\b(${x})|(${A}))[eE][+-]?(${x})[jJ]?(?=${M})`
      },
      {
        begin: `(${A})[jJ]?`
      },
      // decinteger, bininteger, octinteger, hexinteger
      // https://docs.python.org/3.9/reference/lexical_analysis.html#integer-literals
      // optionally "long" in Python 2
      // https://docs.python.org/2.7/reference/lexical_analysis.html#integer-and-long-integer-literals
      // decinteger is optionally imaginary
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      {
        begin: `\\b([1-9](_?[0-9])*|0+(_?0)*)[lLjJ]?(?=${M})`
      },
      {
        begin: `\\b0[bB](_?[01])+[lL]?(?=${M})`
      },
      {
        begin: `\\b0[oO](_?[0-7])+[lL]?(?=${M})`
      },
      {
        begin: `\\b0[xX](_?[0-9a-fA-F])+[lL]?(?=${M})`
      },
      // imagnumber (digitpart-based)
      // https://docs.python.org/3.9/reference/lexical_analysis.html#imaginary-literals
      {
        begin: `\\b(${x})[jJ](?=${M})`
      }
    ]
  }, B = {
    className: "comment",
    begin: e.lookahead(/# type:/),
    end: /$/,
    keywords: h,
    contains: [
      {
        // prevent keywords from coloring `type`
        begin: /# type:/
      },
      // comment within a datatype comment includes no keywords
      {
        begin: /#/,
        end: /\b\B/,
        endsWithParent: !0
      }
    ]
  }, $ = {
    className: "params",
    variants: [
      // Exclude params in functions without params
      {
        className: "",
        begin: /\(\s*\)/,
        skip: !0
      },
      {
        begin: /\(/,
        end: /\)/,
        excludeBegin: !0,
        excludeEnd: !0,
        keywords: h,
        contains: [
          "self",
          u,
          N,
          S,
          a.HASH_COMMENT_MODE
        ]
      }
    ]
  };
  return f.contains = [
    S,
    N,
    u
  ], {
    name: "Python",
    aliases: [
      "py",
      "gyp",
      "ipython"
    ],
    unicodeRegex: !0,
    keywords: h,
    illegal: /(<\/|\?)|=>/,
    contains: [
      u,
      N,
      {
        // very common convention
        scope: "variable.language",
        match: /\bself\b/
      },
      {
        // eat "if" prior to string so that it won't accidentally be
        // labeled as an f-string
        beginKeywords: "if",
        relevance: 0
      },
      { match: /\bor\b/, scope: "keyword" },
      S,
      B,
      a.HASH_COMMENT_MODE,
      {
        match: [
          /\bdef/,
          /\s+/,
          n
        ],
        scope: {
          1: "keyword",
          3: "title.function"
        },
        contains: [$]
      },
      {
        variants: [
          {
            match: [
              /\bclass/,
              /\s+/,
              n,
              /\s*/,
              /\(\s*/,
              n,
              /\s*\)/
            ]
          },
          {
            match: [
              /\bclass/,
              /\s+/,
              n
            ]
          }
        ],
        scope: {
          1: "keyword",
          3: "title.class",
          6: "title.class.inherited"
        }
      },
      {
        className: "meta",
        begin: /^[\t ]*@/,
        end: /(?=#)|$/,
        contains: [
          N,
          $,
          S
        ]
      }
    ]
  };
}
const Le = "[A-Za-z$_][0-9A-Za-z$_]*", _t = [
  "as",
  // for exports
  "in",
  "of",
  "if",
  "for",
  "while",
  "finally",
  "var",
  "new",
  "function",
  "do",
  "return",
  "void",
  "else",
  "break",
  "catch",
  "instanceof",
  "with",
  "throw",
  "case",
  "default",
  "try",
  "switch",
  "continue",
  "typeof",
  "delete",
  "let",
  "yield",
  "const",
  "class",
  // JS handles these with a special rule
  // "get",
  // "set",
  "debugger",
  "async",
  "await",
  "static",
  "import",
  "from",
  "export",
  "extends",
  // It's reached stage 3, which is "recommended for implementation":
  "using"
], vt = [
  "true",
  "false",
  "null",
  "undefined",
  "NaN",
  "Infinity"
], Et = [
  // Fundamental objects
  "Object",
  "Function",
  "Boolean",
  "Symbol",
  // numbers and dates
  "Math",
  "Date",
  "Number",
  "BigInt",
  // text
  "String",
  "RegExp",
  // Indexed collections
  "Array",
  "Float32Array",
  "Float64Array",
  "Int8Array",
  "Uint8Array",
  "Uint8ClampedArray",
  "Int16Array",
  "Int32Array",
  "Uint16Array",
  "Uint32Array",
  "BigInt64Array",
  "BigUint64Array",
  // Keyed collections
  "Set",
  "Map",
  "WeakSet",
  "WeakMap",
  // Structured data
  "ArrayBuffer",
  "SharedArrayBuffer",
  "Atomics",
  "DataView",
  "JSON",
  // Control abstraction objects
  "Promise",
  "Generator",
  "GeneratorFunction",
  "AsyncFunction",
  // Reflection
  "Reflect",
  "Proxy",
  // Internationalization
  "Intl",
  // WebAssembly
  "WebAssembly"
], yt = [
  "Error",
  "EvalError",
  "InternalError",
  "RangeError",
  "ReferenceError",
  "SyntaxError",
  "TypeError",
  "URIError"
], xt = [
  "setInterval",
  "setTimeout",
  "clearInterval",
  "clearTimeout",
  "require",
  "exports",
  "eval",
  "isFinite",
  "isNaN",
  "parseFloat",
  "parseInt",
  "decodeURI",
  "decodeURIComponent",
  "encodeURI",
  "encodeURIComponent",
  "escape",
  "unescape"
], wt = [
  "arguments",
  "this",
  "super",
  "console",
  "window",
  "document",
  "localStorage",
  "sessionStorage",
  "module",
  "global"
  // Node.js
], St = [].concat(
  xt,
  Et,
  yt
);
function Pn(a) {
  const e = a.regex, n = (k, { after: ee }) => {
    const ne = "</" + k[0].slice(1);
    return k.input.indexOf(ne, ee) !== -1;
  }, r = Le, o = {
    begin: "<>",
    end: "</>"
  }, c = /<[A-Za-z0-9\\._:-]+\s*\/>/, b = {
    begin: /<[A-Za-z0-9\\._:-]+/,
    end: /\/[A-Za-z0-9\\._:-]+>|\/>/,
    /**
     * @param {RegExpMatchArray} match
     * @param {CallbackResponse} response
     */
    isTrulyOpeningTag: (k, ee) => {
      const ne = k[0].length + k.index, le = k.input[ne];
      if (
        // HTML should not include another raw `` inside a tag
        // nested type?
        // `Array<Array<number>`, etc.
        le === "<" || // the , gives away that this is not HTML
        // `T, A extends keyof T, V`
        le === ","
      ) {
        ee.ignoreMatch();
        return;
      }
      le === ">" && (n(k, { after: ne }) || ee.ignoreMatch());
      let ge;
      const me = k.input.substring(ne);
      if (ge = me.match(/^\s*=/)) {
        ee.ignoreMatch();
        return;
      }
      if ((ge = me.match(/^\s+extends\s+/)) && ge.index === 0) {
        ee.ignoreMatch();
        return;
      }
    }
  }, h = {
    $pattern: Le,
    keyword: _t,
    literal: vt,
    built_in: St,
    "variable.language": wt
  }, u = "[0-9](_?[0-9])*", f = `\\.(${u})`, E = "0|[1-9](_?[0-9])*|0[0-7]*[89][0-9]*", S = {
    className: "number",
    variants: [
      // DecimalLiteral
      { begin: `(\\b(${E})((${f})|\\.)?|(${f}))[eE][+-]?(${u})\\b` },
      { begin: `\\b(${E})\\b((${f})\\b|\\.)?|(${f})\\b` },
      // DecimalBigIntegerLiteral
      { begin: "\\b(0|[1-9](_?[0-9])*)n\\b" },
      // NonDecimalIntegerLiteral
      { begin: "\\b0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n?\\b" },
      { begin: "\\b0[bB][0-1](_?[0-1])*n?\\b" },
      { begin: "\\b0[oO][0-7](_?[0-7])*n?\\b" },
      // LegacyOctalIntegerLiteral (does not include underscore separators)
      // https://tc39.es/ecma262/#sec-additional-syntax-numeric-literals
      { begin: "\\b0[0-7]+n?\\b" }
    ],
    relevance: 0
  }, x = {
    className: "subst",
    begin: "\\$\\{",
    end: "\\}",
    keywords: h,
    contains: []
    // defined later
  }, A = {
    begin: ".?html`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        a.BACKSLASH_ESCAPE,
        x
      ],
      subLanguage: "xml"
    }
  }, M = {
    begin: ".?css`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        a.BACKSLASH_ESCAPE,
        x
      ],
      subLanguage: "css"
    }
  }, N = {
    begin: ".?gql`",
    end: "",
    starts: {
      end: "`",
      returnEnd: !1,
      contains: [
        a.BACKSLASH_ESCAPE,
        x
      ],
      subLanguage: "graphql"
    }
  }, B = {
    className: "string",
    begin: "`",
    end: "`",
    contains: [
      a.BACKSLASH_ESCAPE,
      x
    ]
  }, P = {
    className: "comment",
    variants: [
      a.COMMENT(
        /\/\*\*(?!\/)/,
        "\\*/",
        {
          relevance: 0,
          contains: [
            {
              begin: "(?=@[A-Za-z]+)",
              relevance: 0,
              contains: [
                {
                  className: "doctag",
                  begin: "@[A-Za-z]+"
                },
                {
                  className: "type",
                  begin: "\\{",
                  end: "\\}",
                  excludeEnd: !0,
                  excludeBegin: !0,
                  relevance: 0
                },
                {
                  className: "variable",
                  begin: r + "(?=\\s*(-)|$)",
                  endsParent: !0,
                  relevance: 0
                },
                // eat spaces (not newlines) so we can find
                // types or variables
                {
                  begin: /(?=[^\n])\s/,
                  relevance: 0
                }
              ]
            }
          ]
        }
      ),
      a.C_BLOCK_COMMENT_MODE,
      a.C_LINE_COMMENT_MODE
    ]
  }, W = [
    a.APOS_STRING_MODE,
    a.QUOTE_STRING_MODE,
    A,
    M,
    N,
    B,
    // Skip numbers when they are part of a variable name
    { match: /\$\d+/ },
    S
    // This is intentional:
    // See https://github.com/highlightjs/highlight.js/issues/3288
    // hljs.REGEXP_MODE
  ];
  x.contains = W.concat({
    // we need to pair up {} inside our subst to prevent
    // it from ending too early by matching another }
    begin: /\{/,
    end: /\}/,
    keywords: h,
    contains: [
      "self"
    ].concat(W)
  });
  const Q = [].concat(P, x.contains), G = Q.concat([
    // eat recursive parens in sub expressions
    {
      begin: /(\s*)\(/,
      end: /\)/,
      keywords: h,
      contains: ["self"].concat(Q)
    }
  ]), j = {
    className: "params",
    // convert this to negative lookbehind in v12
    begin: /(\s*)\(/,
    // to match the parms with
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    keywords: h,
    contains: G
  }, re = {
    variants: [
      // class Car extends vehicle
      {
        match: [
          /class/,
          /\s+/,
          r,
          /\s+/,
          /extends/,
          /\s+/,
          e.concat(r, "(", e.concat(/\./, r), ")*")
        ],
        scope: {
          1: "keyword",
          3: "title.class",
          5: "keyword",
          7: "title.class.inherited"
        }
      },
      // class Car
      {
        match: [
          /class/,
          /\s+/,
          r
        ],
        scope: {
          1: "keyword",
          3: "title.class"
        }
      }
    ]
  }, q = {
    relevance: 0,
    match: e.either(
      // Hard coded exceptions
      /\bJSON/,
      // Float32Array, OutT
      /\b[A-Z][a-z]+([A-Z][a-z]*|\d)*/,
      // CSSFactory, CSSFactoryT
      /\b[A-Z]{2,}([A-Z][a-z]+|\d)+([A-Z][a-z]*)*/,
      // FPs, FPsT
      /\b[A-Z]{2,}[a-z]+([A-Z][a-z]+|\d)*([A-Z][a-z]*)*/
      // P
      // single letters are not highlighted
      // BLAH
      // this will be flagged as a UPPER_CASE_CONSTANT instead
    ),
    className: "title.class",
    keywords: {
      _: [
        // se we still get relevance credit for JS library classes
        ...Et,
        ...yt
      ]
    }
  }, se = {
    label: "use_strict",
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use (strict|asm)['"]/
  }, oe = {
    variants: [
      {
        match: [
          /function/,
          /\s+/,
          r,
          /(?=\s*\()/
        ]
      },
      // anonymous function
      {
        match: [
          /function/,
          /\s*(?=\()/
        ]
      }
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    label: "func.def",
    contains: [j],
    illegal: /%/
  }, ie = {
    relevance: 0,
    match: /\b[A-Z][A-Z_0-9]+\b/,
    className: "variable.constant"
  };
  function ce(k) {
    return e.concat("(?!", k.join("|"), ")");
  }
  const te = {
    match: e.concat(
      /\b/,
      ce([
        ...xt,
        "super",
        "import"
      ].map((k) => `${k}\\s*\\(`)),
      r,
      e.lookahead(/\s*\(/)
    ),
    className: "title.function",
    relevance: 0
  }, D = {
    begin: e.concat(/\./, e.lookahead(
      e.concat(r, /(?![0-9A-Za-z$_(])/)
    )),
    end: r,
    excludeBegin: !0,
    keywords: "prototype",
    className: "property",
    relevance: 0
  }, U = {
    match: [
      /get|set/,
      /\s+/,
      r,
      /(?=\()/
    ],
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      {
        // eat to avoid empty params
        begin: /\(\)/
      },
      j
    ]
  }, Y = "(\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)|" + a.UNDERSCORE_IDENT_RE + ")\\s*=>", J = {
    match: [
      /const|var|let/,
      /\s+/,
      r,
      /\s*/,
      /=\s*/,
      /(async\s*)?/,
      // async is optional
      e.lookahead(Y)
    ],
    keywords: "async",
    className: {
      1: "keyword",
      3: "title.function"
    },
    contains: [
      j
    ]
  };
  return {
    name: "JavaScript",
    aliases: ["js", "jsx", "mjs", "cjs"],
    keywords: h,
    // this will be extended by TypeScript
    exports: { PARAMS_CONTAINS: G, CLASS_REFERENCE: q },
    illegal: /#(?![$_A-z])/,
    contains: [
      a.SHEBANG({
        label: "shebang",
        binary: "node",
        relevance: 5
      }),
      se,
      a.APOS_STRING_MODE,
      a.QUOTE_STRING_MODE,
      A,
      M,
      N,
      B,
      P,
      // Skip numbers when they are part of a variable name
      { match: /\$\d+/ },
      S,
      q,
      {
        scope: "attr",
        match: r + e.lookahead(":"),
        relevance: 0
      },
      J,
      {
        // "value" container
        begin: "(" + a.RE_STARTERS_RE + "|\\b(case|return|throw)\\b)\\s*",
        keywords: "return throw case",
        relevance: 0,
        contains: [
          P,
          a.REGEXP_MODE,
          {
            className: "function",
            // we have to count the parens to make sure we actually have the
            // correct bounding ( ) before the =.  There could be any number of
            // sub-expressions inside also surrounded by parens.
            begin: Y,
            returnBegin: !0,
            end: "\\s*=>",
            contains: [
              {
                className: "params",
                variants: [
                  {
                    begin: a.UNDERSCORE_IDENT_RE,
                    relevance: 0
                  },
                  {
                    className: null,
                    begin: /\(\s*\)/,
                    skip: !0
                  },
                  {
                    begin: /(\s*)\(/,
                    end: /\)/,
                    excludeBegin: !0,
                    excludeEnd: !0,
                    keywords: h,
                    contains: G
                  }
                ]
              }
            ]
          },
          {
            // could be a comma delimited list of params to a function call
            begin: /,/,
            relevance: 0
          },
          {
            match: /\s+/,
            relevance: 0
          },
          {
            // JSX
            variants: [
              { begin: o.begin, end: o.end },
              { match: c },
              {
                begin: b.begin,
                // we carefully check the opening tag to see if it truly
                // is a tag and not a false positive
                "on:begin": b.isTrulyOpeningTag,
                end: b.end
              }
            ],
            subLanguage: "xml",
            contains: [
              {
                begin: b.begin,
                end: b.end,
                skip: !0,
                contains: ["self"]
              }
            ]
          }
        ]
      },
      oe,
      {
        // prevent this from getting swallowed up by function
        // since they appear "function like"
        beginKeywords: "while if switch catch for"
      },
      {
        // we have to count the parens to make sure we actually have the correct
        // bounding ( ).  There could be any number of sub-expressions inside
        // also surrounded by parens.
        begin: "\\b(?!function)" + a.UNDERSCORE_IDENT_RE + "\\([^()]*(\\([^()]*(\\([^()]*\\)[^()]*)*\\)[^()]*)*\\)\\s*\\{",
        // end parens
        returnBegin: !0,
        label: "func.def",
        contains: [
          j,
          a.inherit(a.TITLE_MODE, { begin: r, className: "title.function" })
        ]
      },
      // catch ... so it won't trigger the property rule below
      {
        match: /\.\.\./,
        relevance: 0
      },
      D,
      // hack: prevents detection of keywords in some circumstances
      // .keyword()
      // $keyword = x
      {
        match: "\\$" + r,
        relevance: 0
      },
      {
        match: [/\bconstructor(?=\s*\()/],
        className: { 1: "title.function" },
        contains: [j]
      },
      te,
      ie,
      re,
      U,
      {
        match: /\$[(.]/
        // relevance booster for a pattern common to JS libs: `$(something)` and `$.something`
      }
    ]
  };
}
function At(a) {
  const e = a.regex, n = Pn(a), r = Le, o = [
    "any",
    "void",
    "number",
    "boolean",
    "string",
    "object",
    "never",
    "symbol",
    "bigint",
    "unknown"
  ], c = {
    begin: [
      /namespace/,
      /\s+/,
      a.IDENT_RE
    ],
    beginScope: {
      1: "keyword",
      3: "title.class"
    }
  }, b = {
    beginKeywords: "interface",
    end: /\{/,
    excludeEnd: !0,
    keywords: {
      keyword: "interface extends",
      built_in: o
    },
    contains: [n.exports.CLASS_REFERENCE]
  }, h = {
    className: "meta",
    relevance: 10,
    begin: /^\s*['"]use strict['"]/
  }, u = [
    "type",
    // "namespace",
    "interface",
    "public",
    "private",
    "protected",
    "implements",
    "declare",
    "abstract",
    "readonly",
    "enum",
    "override",
    "satisfies"
  ], f = {
    $pattern: Le,
    keyword: _t.concat(u),
    literal: vt,
    built_in: St.concat(o),
    "variable.language": wt
  }, E = {
    className: "meta",
    begin: "@" + r
  }, S = (N, B, $) => {
    const P = N.contains.findIndex((W) => W.label === B);
    if (P === -1)
      throw new Error("can not find mode to replace");
    N.contains.splice(P, 1, $);
  };
  Object.assign(n.keywords, f), n.exports.PARAMS_CONTAINS.push(E);
  const x = n.contains.find((N) => N.scope === "attr"), A = Object.assign(
    {},
    x,
    { match: e.concat(r, e.lookahead(/\s*\?:/)) }
  );
  n.exports.PARAMS_CONTAINS.push([
    n.exports.CLASS_REFERENCE,
    // class reference for highlighting the params types
    x,
    // highlight the params key
    A
    // Added for optional property assignment highlighting
  ]), n.contains = n.contains.concat([
    E,
    c,
    b,
    A
    // Added for optional property assignment highlighting
  ]), S(n, "shebang", a.SHEBANG()), S(n, "use_strict", h);
  const M = n.contains.find((N) => N.label === "func.def");
  return M.relevance = 0, Object.assign(n, {
    name: "TypeScript",
    aliases: [
      "ts",
      "tsx",
      "mts",
      "cts"
    ]
  }), n;
}
function kt(a) {
  const e = a.regex, n = {
    begin: /<\/?[A-Za-z_]/,
    end: ">",
    subLanguage: "xml",
    relevance: 0
  }, r = {
    begin: "^[-\\*]{3,}",
    end: "$"
  }, o = {
    className: "code",
    variants: [
      // TODO: fix to allow these to work with sublanguage also
      { begin: "(`{3,})[^`](.|\\n)*?\\1`*[ ]*" },
      { begin: "(~{3,})[^~](.|\\n)*?\\1~*[ ]*" },
      // needed to allow markdown as a sublanguage to work
      {
        begin: "```",
        end: "```+[ ]*$"
      },
      {
        begin: "~~~",
        end: "~~~+[ ]*$"
      },
      { begin: "`.+?`" },
      {
        begin: "(?=^( {4}|\\t))",
        // use contains to gobble up multiple lines to allow the block to be whatever size
        // but only have a single open/close tag vs one per line
        contains: [
          {
            begin: "^( {4}|\\t)",
            end: "(\\n)$"
          }
        ],
        relevance: 0
      }
    ]
  }, c = {
    className: "bullet",
    begin: "^[ 	]*([*+-]|(\\d+\\.))(?=\\s+)",
    end: "\\s+",
    excludeEnd: !0
  }, b = {
    begin: /^\[[^\n]+\]:/,
    returnBegin: !0,
    contains: [
      {
        className: "symbol",
        begin: /\[/,
        end: /\]/,
        excludeBegin: !0,
        excludeEnd: !0
      },
      {
        className: "link",
        begin: /:\s*/,
        end: /$/,
        excludeBegin: !0
      }
    ]
  }, h = /[A-Za-z][A-Za-z0-9+.-]*/, u = {
    variants: [
      // too much like nested array access in so many languages
      // to have any real relevance
      {
        begin: /\[.+?\]\[.*?\]/,
        relevance: 0
      },
      // popular internet URLs
      {
        begin: /\[.+?\]\(((data|javascript|mailto):|(?:http|ftp)s?:\/\/).*?\)/,
        relevance: 2
      },
      {
        begin: e.concat(/\[.+?\]\(/, h, /:\/\/.*?\)/),
        relevance: 2
      },
      // relative urls
      {
        begin: /\[.+?\]\([./?&#].*?\)/,
        relevance: 1
      },
      // whatever else, lower relevance (might not be a link at all)
      {
        begin: /\[.*?\]\(.*?\)/,
        relevance: 0
      }
    ],
    returnBegin: !0,
    contains: [
      {
        // empty strings for alt or link text
        match: /\[(?=\])/
      },
      {
        className: "string",
        relevance: 0,
        begin: "\\[",
        end: "\\]",
        excludeBegin: !0,
        returnEnd: !0
      },
      {
        className: "link",
        relevance: 0,
        begin: "\\]\\(",
        end: "\\)",
        excludeBegin: !0,
        excludeEnd: !0
      },
      {
        className: "symbol",
        relevance: 0,
        begin: "\\]\\[",
        end: "\\]",
        excludeBegin: !0,
        excludeEnd: !0
      }
    ]
  }, f = {
    className: "strong",
    contains: [],
    // defined later
    variants: [
      {
        begin: /_{2}(?!\s)/,
        end: /_{2}/
      },
      {
        begin: /\*{2}(?!\s)/,
        end: /\*{2}/
      }
    ]
  }, E = {
    className: "emphasis",
    contains: [],
    // defined later
    variants: [
      {
        begin: /\*(?![*\s])/,
        end: /\*/
      },
      {
        begin: /_(?![_\s])/,
        end: /_/,
        relevance: 0
      }
    ]
  }, S = a.inherit(f, { contains: [] }), x = a.inherit(E, { contains: [] });
  f.contains.push(x), E.contains.push(S);
  let A = [
    n,
    u
  ];
  return [
    f,
    E,
    S,
    x
  ].forEach(($) => {
    $.contains = $.contains.concat(A);
  }), A = A.concat(f, E), {
    name: "Markdown",
    aliases: [
      "md",
      "mkdown",
      "mkd"
    ],
    contains: [
      {
        className: "section",
        variants: [
          {
            begin: "^#{1,6}",
            end: "$",
            contains: A
          },
          {
            begin: "(?=^.+?\\n[=-]{2,}$)",
            contains: [
              { begin: "^[=-]*$" },
              {
                begin: "^",
                end: "\\n",
                contains: A
              }
            ]
          }
        ]
      },
      n,
      c,
      f,
      E,
      {
        className: "quote",
        begin: "^>\\s+",
        contains: A,
        end: "$"
      },
      o,
      r,
      u,
      b,
      {
        //https://spec.commonmark.org/0.31.2/#entity-references
        scope: "literal",
        match: /&([a-zA-Z0-9]+|#[0-9]{1,7}|#[Xx][0-9a-fA-F]{1,6});/
      }
    ]
  };
}
function De(a) {
  const e = a.regex, n = [
    "absolute_url",
    "asset|0",
    "asset_version",
    "attribute",
    "block",
    "constant",
    "controller|0",
    "country_timezones",
    "csrf_token",
    "cycle",
    "date",
    "dump",
    "expression",
    "form|0",
    "form_end",
    "form_errors",
    "form_help",
    "form_label",
    "form_rest",
    "form_row",
    "form_start",
    "form_widget",
    "html_classes",
    "include",
    "is_granted",
    "logout_path",
    "logout_url",
    "max",
    "min",
    "parent",
    "path|0",
    "random",
    "range",
    "relative_path",
    "render",
    "render_esi",
    "source",
    "template_from_string",
    "url|0"
  ], r = [
    "abs",
    "abbr_class",
    "abbr_method",
    "batch",
    "capitalize",
    "column",
    "convert_encoding",
    "country_name",
    "currency_name",
    "currency_symbol",
    "data_uri",
    "date",
    "date_modify",
    "default",
    "escape",
    "file_excerpt",
    "file_link",
    "file_relative",
    "filter",
    "first",
    "format",
    "format_args",
    "format_args_as_text",
    "format_currency",
    "format_date",
    "format_datetime",
    "format_file",
    "format_file_from_text",
    "format_number",
    "format_time",
    "html_to_markdown",
    "humanize",
    "inky_to_html",
    "inline_css",
    "join",
    "json_encode",
    "keys",
    "language_name",
    "last",
    "length",
    "locale_name",
    "lower",
    "map",
    "markdown",
    "markdown_to_html",
    "merge",
    "nl2br",
    "number_format",
    "raw",
    "reduce",
    "replace",
    "reverse",
    "round",
    "slice",
    "slug",
    "sort",
    "spaceless",
    "split",
    "striptags",
    "timezone_name",
    "title",
    "trans",
    "transchoice",
    "trim",
    "u|0",
    "upper",
    "url_encode",
    "yaml_dump",
    "yaml_encode"
  ];
  let o = [
    "apply",
    "autoescape",
    "block",
    "cache",
    "deprecated",
    "do",
    "embed",
    "extends",
    "filter",
    "flush",
    "for",
    "form_theme",
    "from",
    "if",
    "import",
    "include",
    "macro",
    "sandbox",
    "set",
    "stopwatch",
    "trans",
    "trans_default_domain",
    "transchoice",
    "use",
    "verbatim",
    "with"
  ];
  o = o.concat(o.map((M) => `end${M}`));
  const c = {
    scope: "string",
    variants: [
      {
        begin: /'/,
        end: /'/
      },
      {
        begin: /"/,
        end: /"/
      }
    ]
  }, b = {
    scope: "number",
    match: /\d+/
  }, h = {
    begin: /\(/,
    end: /\)/,
    excludeBegin: !0,
    excludeEnd: !0,
    contains: [
      c,
      b
    ]
  }, u = {
    beginKeywords: n.join(" "),
    keywords: { name: n },
    relevance: 0,
    contains: [h]
  }, f = {
    match: /\|(?=[A-Za-z_]+:?)/,
    beginScope: "punctuation",
    relevance: 0,
    contains: [
      {
        match: /[A-Za-z_]+:?/,
        keywords: r
      }
    ]
  }, E = (M, { relevance: N }) => ({
    beginScope: {
      1: "template-tag",
      3: "name"
    },
    relevance: N || 2,
    endScope: "template-tag",
    begin: [
      /\{%/,
      /\s*/,
      e.either(...M)
    ],
    end: /%\}/,
    keywords: "in",
    contains: [
      f,
      u,
      c,
      b
    ]
  }), S = /[a-z_]+/, x = E(o, { relevance: 2 }), A = E([S], { relevance: 1 });
  return {
    name: "Twig",
    aliases: ["craftcms"],
    case_insensitive: !0,
    subLanguage: "xml",
    contains: [
      a.COMMENT(/\{#/, /#\}/),
      x,
      A,
      {
        className: "template-variable",
        begin: /\{\{/,
        end: /\}\}/,
        contains: [
          "self",
          f,
          u,
          c,
          b
        ]
      }
    ]
  };
}
C.registerLanguage("javascript", pt);
C.registerLanguage("js", pt);
C.registerLanguage("css", Ln);
C.registerLanguage("html", we);
C.registerLanguage("xml", we);
C.registerLanguage("xhtml", we);
C.registerLanguage("svg", we);
C.registerLanguage("markup", we);
C.registerLanguage("json", In);
C.registerLanguage("yaml", ft);
C.registerLanguage("yml", ft);
C.registerLanguage("php", $n);
C.registerLanguage("http", Bn);
C.registerLanguage("plaintext", $e);
C.registerLanguage("text", $e);
C.registerLanguage("txt", $e);
C.registerLanguage("csv", $e);
C.registerLanguage("diff", Dn);
C.registerLanguage("bash", Be);
C.registerLanguage("shell", Be);
C.registerLanguage("sh", Be);
C.registerLanguage("zsh", Be);
C.registerLanguage("python", mt);
C.registerLanguage("py", mt);
C.registerLanguage("typescript", At);
C.registerLanguage("ts", At);
C.registerLanguage("markdown", kt);
C.registerLanguage("md", kt);
C.registerLanguage("astro", we);
C.registerLanguage("nunjucks", De);
C.registerLanguage("njk", De);
C.registerLanguage("jinja", De);
C.registerLanguage("jinja2", De);
function Un(a) {
  const e = /(<\/?span[^>]*>)|([^<]+)/g, n = [""], r = [];
  let o;
  for (; (o = e.exec(a)) !== null; ) {
    const c = o[1], b = o[2];
    if (c)
      c.startsWith("</") ? r.pop() : r.push(c), n[n.length - 1] += c;
    else {
      const h = b.split(`
`);
      for (let u = 0; u < h.length; u++)
        u > 0 && (n[n.length - 1] += "</span>".repeat(r.length), n.push(r.join(""))), n[n.length - 1] += h[u];
    }
  }
  return n;
}
if (typeof document < "u") {
  const a = document.createElement("style");
  a.textContent = "code-block:not(:defined),code-block-group:not(:defined){display:block;opacity:0}", document.head.appendChild(a);
}
const Ae = /* @__PURE__ */ new Set();
let Ee = null, Ie = null;
function Pe() {
  const a = document.documentElement, e = document.body;
  if (!a || !e) return null;
  if (a.classList.contains("dark") || e.classList.contains("dark") || a.getAttribute("data-theme") === "dark" || e.getAttribute("data-theme") === "dark") return !0;
  if (a.getAttribute("data-theme") === "light" || e.getAttribute("data-theme") === "light") return !1;
  if (a.getAttribute("data-bs-theme") === "dark" || e.getAttribute("data-bs-theme") === "dark") return !0;
  if (a.getAttribute("data-bs-theme") === "light" || e.getAttribute("data-bs-theme") === "light") return !1;
  if (a.getAttribute("data-mode") === "dark") return !0;
  if (a.getAttribute("data-mode") === "light") return !1;
  const n = getComputedStyle(a).colorScheme;
  return n === "dark" ? !0 : n === "light" ? !1 : null;
}
function Hn() {
  const a = Pe();
  if (a !== Ie) {
    Ie = a;
    for (const e of Ae)
      e._onPageModeChange(a);
  }
}
function zn() {
  if (Ee) return;
  Ee = new MutationObserver(Hn);
  const a = {
    attributes: !0,
    attributeFilter: ["class", "data-theme", "data-bs-theme", "data-mode", "style"]
  };
  Ee.observe(document.documentElement, a), document.body && Ee.observe(document.body, a);
}
function Fn() {
  Ee && (Ee.disconnect(), Ee = null);
}
function We(a) {
  Ae.add(a), Ae.size === 1 && zn();
  const e = Pe();
  Ie = e, a._onPageModeChange(e);
}
function Nt(a) {
  Ae.delete(a), Ae.size === 0 && (Fn(), Ie = null);
}
class Gn extends HTMLElement {
  constructor() {
    super(), this.shadowRoot || this.attachShadow({ mode: "open" }), this._codeContent = null, this._showShareMenu = !1, this._handleOutsideClick = this._handleOutsideClick.bind(this), this._observer = null, this._highlighted = !1, this._isLoading = !1, this._loadError = null;
  }
  connectedCallback() {
    var n;
    if ((n = this.shadowRoot) != null && n.children.length && this.hasAttribute("data-ssr")) {
      const r = this.querySelector("textarea");
      r && (this._codeContent = r.value || r.textContent, r.remove()), this._hydrateInteractivity(), We(this);
      return;
    }
    const e = this.querySelector("textarea");
    e ? (this._codeContent = e.value || e.textContent, e.remove()) : this._codeContent = this.textContent, this.src ? this._loadFromSrc() : this.hasAttribute("lazy") ? (this.renderPlaceholder(), this._setupLazyObserver()) : this.render(), We(this);
  }
  disconnectedCallback() {
    Nt(this), this._observer && (this._observer.disconnect(), this._observer = null), document.removeEventListener("click", this._handleOutsideClick);
  }
  /**
   * Set up IntersectionObserver for lazy highlighting
   */
  _setupLazyObserver() {
    this._observer || (this._observer = new IntersectionObserver(
      (e) => {
        e[0].isIntersecting && !this._highlighted && (this._highlighted = !0, this.render(), this._observer.disconnect(), this._observer = null);
      },
      { rootMargin: "100px" }
      // Start loading slightly before visible
    ), this._observer.observe(this));
  }
  /**
   * Load code content from external URL specified by src attribute
   */
  async _loadFromSrc() {
    const e = this.src;
    if (e) {
      this._isLoading = !0, this._loadError = null, this._renderLoadingState();
      try {
        const n = await fetch(e);
        if (!n.ok)
          throw new Error(`HTTP ${n.status}: ${n.statusText}`);
        const r = await n.text();
        if (this._codeContent = r, !this.hasAttribute("language")) {
          const o = this._detectLanguageFromUrl(e);
          o && this.setAttribute("language", o);
        }
        if (!this.hasAttribute("filename")) {
          const o = e.split("/").pop().split("?")[0];
          o && this.setAttribute("filename", o);
        }
        this._isLoading = !1, this.render(), this.dispatchEvent(new CustomEvent("code-loaded", {
          detail: { url: e, code: r },
          bubbles: !0
        }));
      } catch (n) {
        this._isLoading = !1, this._loadError = n.message, this._renderErrorState(), this.dispatchEvent(new CustomEvent("code-load-error", {
          detail: { url: e, error: n.message },
          bubbles: !0
        }));
      }
    }
  }
  /**
   * Detect language from URL file extension
   */
  _detectLanguageFromUrl(e) {
    const n = {
      js: "javascript",
      mjs: "javascript",
      cjs: "javascript",
      ts: "typescript",
      tsx: "typescript",
      jsx: "javascript",
      py: "python",
      css: "css",
      html: "html",
      htm: "html",
      json: "json",
      yaml: "yaml",
      yml: "yaml",
      xml: "xml",
      svg: "xml",
      sh: "bash",
      bash: "bash",
      zsh: "bash",
      php: "php",
      diff: "diff",
      patch: "diff",
      md: "markdown",
      markdown: "markdown",
      txt: "plaintext"
    }, o = e.split("/").pop().split("?")[0].split("#")[0].split(".").pop().toLowerCase();
    return n[o] || null;
  }
  /**
   * Render loading state while fetching external content
   */
  _renderLoadingState() {
    const e = this.theme === "dark";
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          <span class="label">Loading...</span>
          ${this.src ? `<span class="filename">${this.escapeHtml(this.src.split("/").pop().split("?")[0])}</span>` : ""}
        </div>
      </div>
      <div class="code-container" style="padding: 2rem; text-align: center;">
        <div class="loading-spinner" style="
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 2px solid ${e ? "#30363d" : "#e1e4e8"};
          border-top-color: ${e ? "#58a6ff" : "#0969da"};
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        "></div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      </div>
    `;
  }
  /**
   * Render error state when external content fails to load
   */
  _renderErrorState() {
    const e = this.theme === "dark";
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          <span class="label" style="color: ${e ? "#f85149" : "#cf222e"};">Error</span>
          ${this.src ? `<span class="filename">${this.escapeHtml(this.src.split("/").pop().split("?")[0])}</span>` : ""}
        </div>
        <div class="header-actions">
          <button class="copy-button" onclick="this.getRootNode().host._loadFromSrc()">Retry</button>
        </div>
      </div>
      <div class="code-container" style="padding: 1.5rem; text-align: center;">
        <div style="color: ${e ? "#f85149" : "#cf222e"}; margin-bottom: 0.5rem;">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style="vertical-align: middle;">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"/>
          </svg>
        </div>
        <div style="color: ${e ? "#8b949e" : "#57606a"}; font-size: 0.875rem;">
          Failed to load: ${this.escapeHtml(this._loadError || "Unknown error")}
        </div>
        <div style="color: ${e ? "#484f58" : "#6e7781"}; font-size: 0.75rem; margin-top: 0.25rem;">
          ${this.escapeHtml(this.src)}
        </div>
      </div>
    `;
  }
  static get observedAttributes() {
    return [
      "language",
      "label",
      "theme",
      "data-page-theme",
      "show-lines",
      "start-line",
      "end-line",
      "filename",
      "highlight-lines",
      "collapsed",
      "max-lines",
      "max-height",
      "wrap",
      "copy-text",
      "copied-text",
      "show-share",
      "show-download",
      "no-copy",
      "lazy",
      "focus-mode",
      "src"
    ];
  }
  attributeChangedCallback(e, n, r) {
    if (this.shadowRoot && n !== r) {
      if (e === "src" && r) {
        this._loadFromSrc();
        return;
      }
      e === "theme" && (this.hasAttribute("theme") ? this.removeAttribute("data-page-theme") : this._onPageModeChange(Pe())), this.render();
    }
  }
  _onPageModeChange(e) {
    if (this.hasAttribute("theme")) {
      this.removeAttribute("data-page-theme");
      return;
    }
    e === !0 ? this.setAttribute("data-page-theme", "dark") : e === !1 ? this.setAttribute("data-page-theme", "light") : this.removeAttribute("data-page-theme");
  }
  get language() {
    return this.getAttribute("language") || "plaintext";
  }
  get label() {
    return this.getAttribute("label") || this.filename || this.language.toUpperCase();
  }
  get theme() {
    return this.getAttribute("theme") || this.getAttribute("data-page-theme") || "light";
  }
  get showLines() {
    return this.hasAttribute("show-lines");
  }
  get startLine() {
    const e = this.getAttribute("start-line");
    if (e === null) return 1;
    const n = parseInt(e, 10);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  }
  get endLine() {
    const e = this.getAttribute("end-line");
    if (e === null) return null;
    const n = parseInt(e, 10);
    return Number.isFinite(n) && n >= 1 ? n : null;
  }
  get filename() {
    return this.getAttribute("filename") || "";
  }
  get highlightLines() {
    const e = this.getAttribute("highlight-lines");
    if (!e) return /* @__PURE__ */ new Set();
    const n = /* @__PURE__ */ new Set(), r = e.split(",");
    for (const o of r) {
      const c = o.trim();
      if (c.includes("-")) {
        const [b, h] = c.split("-").map(Number);
        for (let u = b; u <= h; u++)
          n.add(u);
      } else
        n.add(Number(c));
    }
    return n;
  }
  get collapsed() {
    return this.hasAttribute("collapsed");
  }
  get maxLines() {
    const e = this.getAttribute("max-lines");
    return e ? parseInt(e, 10) : 10;
  }
  get maxHeight() {
    return this.getAttribute("max-height") || "";
  }
  get wrap() {
    return this.hasAttribute("wrap");
  }
  get copyText() {
    return this.getAttribute("copy-text") || "Copy";
  }
  get copiedText() {
    return this.getAttribute("copied-text") || "Copied!";
  }
  get showShare() {
    return this.hasAttribute("show-share");
  }
  get showDownload() {
    return this.hasAttribute("show-download");
  }
  get noCopy() {
    return this.hasAttribute("no-copy");
  }
  get lazy() {
    return this.hasAttribute("lazy");
  }
  get focusMode() {
    return this.hasAttribute("focus-mode");
  }
  get src() {
    return this.getAttribute("src") || "";
  }
  async copyCode() {
    const e = this.getCode(), n = this.shadowRoot.querySelector(".copy-button"), r = this.copyText, o = this.copiedText;
    try {
      await navigator.clipboard.writeText(e), n.textContent = o, n.classList.add("copied"), n.setAttribute("aria-label", "Code copied to clipboard");
    } catch (c) {
      console.error("Failed to copy code:", c), n.textContent = "Failed", n.classList.add("failed"), n.setAttribute("aria-label", "Failed to copy code");
    }
    setTimeout(() => {
      n.textContent = r, n.classList.remove("copied", "failed"), n.setAttribute("aria-label", "Copy code to clipboard");
    }, 2e3);
  }
  /**
   * Download code as a file
   */
  downloadCode() {
    const e = this.getCode(), n = this.filename || `code.${this._getFileExtension()}`, r = new Blob([e], { type: "text/plain" }), o = URL.createObjectURL(r), c = document.createElement("a");
    c.href = o, c.download = n, document.body.appendChild(c), c.click(), document.body.removeChild(c), URL.revokeObjectURL(o);
  }
  /**
   * Get file extension based on language
   */
  _getFileExtension() {
    return {
      javascript: "js",
      js: "js",
      typescript: "ts",
      ts: "ts",
      html: "html",
      markup: "html",
      css: "css",
      json: "json",
      yaml: "yml",
      yml: "yml",
      php: "php",
      xml: "xml",
      xhtml: "xhtml",
      svg: "svg",
      http: "http",
      diff: "diff",
      csv: "csv",
      plaintext: "txt",
      text: "txt",
      txt: "txt"
    }[this.language] || "txt";
  }
  /**
   * Toggle share menu visibility
   */
  toggleShareMenu() {
    this._showShareMenu = !this._showShareMenu;
    const e = this.shadowRoot.querySelector(".share-menu"), n = this.shadowRoot.querySelector(".share-button");
    this._showShareMenu ? (e.style.display = "block", n.classList.add("active"), setTimeout(() => {
      document.addEventListener("click", this._handleOutsideClick);
    }, 0)) : (e.style.display = "none", n.classList.remove("active"), document.removeEventListener("click", this._handleOutsideClick));
  }
  _handleOutsideClick(e) {
    const n = this.shadowRoot.querySelector(".share-menu");
    n && !n.contains(e.target) && this.toggleShareMenu();
  }
  /**
   * Share via Web Share API
   */
  async shareViaWebAPI() {
    if (!navigator.share) return;
    const e = this.getCode(), n = this.filename || this.label;
    try {
      await navigator.share({
        title: n,
        text: e
      }), this.toggleShareMenu();
    } catch (r) {
      r.name !== "AbortError" && console.error("Error sharing:", r);
    }
  }
  /**
   * Open code in CodePen
   */
  openInCodePen() {
    const e = this.getCode(), n = this.language;
    let r = {
      title: this.filename || this.label || "Code Block Demo",
      description: "Code shared from code-block component",
      editors: "111"
    };
    ["html", "markup", "xhtml", "xml", "svg"].includes(n) ? (r.html = e, r.editors = "100") : n === "css" ? (r.css = e, r.editors = "010") : ["javascript", "js"].includes(n) ? (r.js = e, r.editors = "001") : (r.html = `<pre><code>${this.escapeHtml(e)}</code></pre>`, r.editors = "100");
    const o = document.createElement("form");
    o.action = "https://codepen.io/pen/define", o.method = "POST", o.target = "_blank";
    const c = document.createElement("input");
    c.type = "hidden", c.name = "data", c.value = JSON.stringify(r), o.appendChild(c), document.body.appendChild(o), o.submit(), document.body.removeChild(o), this.toggleShareMenu();
  }
  getStyles() {
    const e = this.theme === "dark";
    return `
      :host {
        /* Internal defaults — external --cb-* overrides always win */
        --_cb-bg: ${e ? "var(--color-surface-raised, #0d1117)" : "var(--color-surface-raised, #f6f8fa)"};
        --_cb-code-bg: ${e ? "var(--color-surface, #0d1117)" : "var(--color-surface, #fff)"};
        --_cb-header-bg: ${e ? "var(--color-surface-raised, #161b22)" : "var(--color-surface-raised, #e1e4e8)"};
        --_cb-text-color: ${e ? "var(--color-text, #c9d1d9)" : "var(--color-text, #24292e)"};
        --_cb-border-color: ${e ? "var(--color-border, #30363d)" : "var(--color-border, #e1e4e8)"};
        --_cb-comment: ${e ? "var(--color-text-muted, #8b949e)" : "var(--color-text-muted, #6a737d)"};
        --_cb-button-bg: ${e ? "#21262d" : "#fff"};
        --_cb-button-color: ${e ? "var(--color-text, #c9d1d9)" : "var(--color-text, #24292e)"};
        --_cb-scrollbar-track: ${e ? "#161b22" : "#f6f8fa"};
        --_cb-scrollbar-thumb: ${e ? "#30363d" : "#d1d5da"};

        display: block;
        margin: var(--cb-margin, 1rem 0);
        border-radius: var(--cb-border-radius, 8px);
        overflow: hidden;
        border: 1px solid var(--cb-border-color, var(--_cb-border-color));
        background: var(--cb-bg, var(--_cb-bg));
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
        font-size: var(--cb-font-size, 0.875rem);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--cb-header-padding, 0.5rem 1rem);
        background: var(--cb-header-bg, var(--_cb-header-bg));
        border-bottom: 1px solid var(--cb-border-color, var(--_cb-border-color));
        gap: 1rem;
      }

      .label-container {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        min-width: 0;
        flex: 1;
      }

      .label {
        font-size: 0.75rem;
        font-weight: 600;
        color: var(--cb-label-color, ${e ? "#8b949e" : "#586069"});
        text-transform: uppercase;
        letter-spacing: 0.5px;
        flex-shrink: 0;
      }

      .filename {
        font-size: 0.8rem;
        color: var(--cb-filename-color, ${e ? "#c9d1d9" : "#24292e"});
        font-weight: 500;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
      }

      .copy-button {
        background: var(--cb-button-bg, var(--_cb-button-bg));
        border-width: var(--cb-button-border-width, 1px);
        border-style: var(--cb-button-border-style, solid);
        border-color: var(--cb-button-border, ${e ? "#30363d" : "#d1d5da"});
        border-radius: var(--cb-button-radius, 4px);
        padding: var(--cb-button-padding, 4px 12px);
        font-size: var(--cb-button-font-size, 0.75rem);
        font-weight: 500;
        color: var(--cb-button-color, var(--_cb-button-color));
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: var(--cb-ui-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        flex-shrink: 0;
      }

      .copy-button:hover {
        background: var(--cb-button-hover-bg, ${e ? "#30363d" : "#f3f4f6"});
        border-color: var(--cb-button-hover-border, ${e ? "#8b949e" : "#959da5"});
      }

      .copy-button:focus {
        outline: 2px solid var(--cb-focus-color, ${e ? "#58a6ff" : "#0366d6"});
        outline-offset: 2px;
      }

      .copy-button:active {
        transform: scale(0.98);
      }

      .copy-button.copied {
        background: var(--cb-success-color, #238636);
        color: white;
        border-color: var(--cb-success-color, #238636);
      }

      .copy-button.failed {
        background: var(--cb-error-color, #da3633);
        color: white;
        border-color: var(--cb-error-color, #da3633);
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .action-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 0.25rem;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--cb-label-color, ${e ? "#8b949e" : "#57606a"});
        transition: all 0.15s ease;
        border-radius: var(--cb-button-radius, 4px);
      }

      .action-button:hover {
        color: var(--cb-button-color, var(--_cb-button-color));
        background: var(--cb-action-button-hover-bg, ${e ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)"});
      }

      .action-button:active {
        transform: scale(0.95);
      }

      .action-button.active {
        color: var(--cb-focus-color, ${e ? "#58a6ff" : "#0969da"});
        background: ${e ? "rgba(56, 139, 253, 0.15)" : "rgba(9, 105, 218, 0.1)"};
      }

      .action-button svg {
        width: 16px;
        height: 16px;
      }

      .share-container {
        position: relative;
        display: inline-block;
      }

      .share-menu {
        display: none;
        position: absolute;
        top: calc(100% + 4px);
        right: 0;
        background: var(--cb-header-bg, var(--_cb-header-bg));
        border: 1px solid var(--cb-border-color, var(--_cb-border-color));
        border-radius: var(--cb-menu-radius, 8px);
        box-shadow: var(--cb-shadow, 0 4px 12px rgba(0, 0, 0, 0.15));
        min-width: 160px;
        z-index: 1000;
        overflow: hidden;
      }

      .share-menu-item {
        display: flex;
        align-items: center;
        gap: 0.625rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: none;
        border: none;
        color: var(--cb-text-color, var(--_cb-text-color));
        font-size: 0.8125rem;
        font-weight: 500;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s ease;
        border-bottom: 1px solid var(--cb-border-color, var(--_cb-border-color));
        font-family: var(--cb-ui-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
      }

      .share-menu-item:last-child {
        border-bottom: none;
      }

      .share-menu-item:hover {
        background: ${e ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"};
      }

      .share-menu-item:active {
        background: ${e ? "rgba(56, 139, 253, 0.15)" : "rgba(9, 105, 218, 0.1)"};
      }

      .share-menu-item svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }

      .code-container {
        display: flex;
        overflow-x: auto;
        background: var(--cb-code-bg, var(--_cb-code-bg));
      }

      .line-numbers {
        padding: var(--cb-code-padding, 1rem) 0;
        text-align: right;
        user-select: none;
        background: var(--cb-line-numbers-bg, ${e ? "#161b22" : "#f6f8fa"});
        border-right: 1px solid var(--cb-border-color, var(--_cb-border-color));
        color: var(--cb-line-numbers-color, ${e ? "#484f58" : "#959da5"});
        line-height: var(--cb-line-height, 1.6);
        flex-shrink: 0;
      }

      .line-numbers span {
        display: block;
        padding: 0 0.75rem;
        min-width: 2.5rem;
      }

      .line-numbers span.highlighted {
        background: var(--cb-highlight-gutter, ${e ? "rgba(136, 192, 208, 0.15)" : "rgba(255, 235, 59, 0.3)"});
        color: var(--cb-line-numbers-highlight-color, ${e ? "#c9d1d9" : "#24292e"});
      }

      pre {
        margin: 0;
        padding: 0;
        flex: 1;
        overflow-x: auto;
      }

      code {
        display: block;
        font-family: inherit;
        color: var(--cb-text-color, var(--_cb-text-color));
        background: transparent;
        padding: var(--cb-code-padding, 1rem);
      }

      .code-line {
        display: block;
        line-height: var(--cb-line-height, 1.6);
        padding: 0 0.5rem;
        margin: 0 -0.5rem;
        white-space: pre;
      }

      .code-line.highlighted {
        background: var(--cb-highlight-bg, ${e ? "rgba(136, 192, 208, 0.15)" : "rgba(255, 235, 59, 0.3)"});
        border-left: 3px solid var(--cb-highlight-border, ${e ? "#58a6ff" : "#f9a825"});
        margin-left: calc(-0.5rem - 3px);
        padding-left: calc(0.5rem + 3px);
      }

      /* Focus mode - dims non-highlighted lines */
      :host([focus-mode]) .code-line:not(.highlighted) {
        opacity: var(--cb-focus-dim-opacity, 0.4);
        filter: blur(var(--cb-focus-blur, 0.5px));
        transition: opacity 0.2s ease, filter 0.2s ease;
      }

      :host([focus-mode]) .code-line.highlighted {
        opacity: 1;
        filter: none;
      }

      :host([focus-mode]) .line-numbers span:not(.highlighted) {
        opacity: var(--cb-focus-dim-opacity, 0.4);
      }

      /* highlight.js theme - GitHub style with CSS custom properties */
      .hljs-comment,
      .hljs-quote {
        color: var(--cb-comment, var(--_cb-comment));
        font-style: italic;
      }

      .hljs-keyword,
      .hljs-selector-tag,
      .hljs-addition {
        color: var(--cb-keyword, ${e ? "#ff7b72" : "#d73a49"});
      }

      .hljs-number,
      .hljs-literal,
      .hljs-doctag,
      .hljs-regexp {
        color: var(--cb-number, ${e ? "#79c0ff" : "#005cc5"});
      }

      .hljs-string,
      .hljs-meta .hljs-meta-string {
        color: var(--cb-string, ${e ? "#a5d6ff" : "#22863a"});
      }

      .hljs-title,
      .hljs-section,
      .hljs-name,
      .hljs-selector-id,
      .hljs-selector-class {
        color: var(--cb-function, ${e ? "#d2a8ff" : "#6f42c1"});
      }

      .hljs-attribute,
      .hljs-attr,
      .hljs-variable,
      .hljs-template-variable,
      .hljs-class .hljs-title,
      .hljs-type {
        color: var(--cb-attribute, ${e ? "#79c0ff" : "#005cc5"});
      }

      .hljs-symbol,
      .hljs-bullet,
      .hljs-subst,
      .hljs-meta,
      .hljs-meta .hljs-keyword,
      .hljs-selector-attr,
      .hljs-selector-pseudo,
      .hljs-link {
        color: var(--cb-meta, ${e ? "#ffa657" : "#e36209"});
      }

      .hljs-built_in,
      .hljs-deletion {
        color: var(--cb-builtin, ${e ? "#ffa198" : "#d73a49"});
      }

      .hljs-tag {
        color: var(--cb-tag, ${e ? "#7ee787" : "#22863a"});
      }

      .hljs-tag .hljs-name {
        color: var(--cb-tag, ${e ? "#7ee787" : "#22863a"});
      }

      .hljs-tag .hljs-attr {
        color: var(--cb-attribute, ${e ? "#79c0ff" : "#005cc5"});
      }

      .hljs-emphasis {
        font-style: italic;
      }

      .hljs-strong {
        font-weight: bold;
      }

      /* Diff support - added/removed lines */
      .code-line.diff-add {
        background: var(--cb-diff-add-bg, ${e ? "rgba(46, 160, 67, 0.2)" : "rgba(46, 160, 67, 0.15)"});
        border-left: 3px solid var(--cb-diff-add-border, ${e ? "#3fb950" : "#22863a"});
        margin-left: calc(-0.5rem - 3px);
        padding-left: calc(0.5rem + 3px);
      }

      .code-line.diff-remove {
        background: var(--cb-diff-remove-bg, ${e ? "rgba(248, 81, 73, 0.2)" : "rgba(248, 81, 73, 0.15)"});
        border-left: 3px solid var(--cb-diff-remove-border, ${e ? "#f85149" : "#cb2431"});
        margin-left: calc(-0.5rem - 3px);
        padding-left: calc(0.5rem + 3px);
      }

      .line-numbers span.diff-add {
        background: var(--cb-diff-add-gutter, ${e ? "rgba(46, 160, 67, 0.15)" : "rgba(46, 160, 67, 0.1)"});
        color: var(--cb-diff-add-color, ${e ? "#3fb950" : "#22863a"});
      }

      .line-numbers span.diff-remove {
        background: var(--cb-diff-remove-gutter, ${e ? "rgba(248, 81, 73, 0.15)" : "rgba(248, 81, 73, 0.1)"});
        color: var(--cb-diff-remove-color, ${e ? "#f85149" : "#cb2431"});
      }

      .hljs-addition {
        color: var(--cb-diff-add-text, ${e ? "#3fb950" : "#22863a"});
        background: transparent;
      }

      .hljs-deletion {
        color: var(--cb-diff-remove-text, ${e ? "#f85149" : "#cb2431"});
        background: transparent;
      }

      /* Collapsible code blocks */
      :host([collapsed]) .code-container {
        position: relative;
      }

      :host([collapsed]) .code-container::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 60px;
        background: linear-gradient(transparent, var(--cb-code-bg, var(--_cb-code-bg)));
        pointer-events: none;
      }

      :host([collapsed]) pre {
        overflow: hidden;
      }

      :host([collapsed]) code {
        display: block;
        overflow: hidden;
      }

      .expand-button {
        display: none;
        width: 100%;
        padding: 0.5rem 1rem;
        background: var(--cb-expand-bg, ${e ? "#161b22" : "#f6f8fa"});
        border: none;
        border-top: 1px solid var(--cb-border-color, var(--_cb-border-color));
        color: var(--cb-expand-color, ${e ? "#58a6ff" : "#0366d6"});
        font-size: 0.8rem;
        font-weight: 500;
        cursor: pointer;
        font-family: var(--cb-ui-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
        transition: background 0.2s;
      }

      .expand-button:hover {
        background: var(--cb-expand-hover-bg, ${e ? "#21262d" : "#e1e4e8"});
      }

      .expand-button:focus {
        outline: 2px solid var(--cb-focus-color, ${e ? "#58a6ff" : "#0366d6"});
        outline-offset: -2px;
      }

      :host([collapsed]) .expand-button,
      :host([data-expandable]) .expand-button {
        display: block;
      }

      /* Max height with scroll */
      :host([max-height]) .code-container {
        max-height: var(--cb-max-height);
        overflow-y: auto;
      }

      :host([max-height]) .code-container::-webkit-scrollbar {
        width: 8px;
      }

      :host([max-height]) .code-container::-webkit-scrollbar-track {
        background: var(--cb-scrollbar-track, var(--_cb-scrollbar-track));
      }

      :host([max-height]) .code-container::-webkit-scrollbar-thumb {
        background: var(--cb-scrollbar-thumb, var(--_cb-scrollbar-thumb));
        border-radius: var(--cb-button-radius, 4px);
      }

      :host([max-height]) .code-container::-webkit-scrollbar-thumb:hover {
        background: var(--cb-scrollbar-thumb-hover, ${e ? "#484f58" : "#959da5"});
      }

      /* Word wrap option */
      :host([wrap]) code {
        white-space: pre-wrap;
        word-break: break-word;
        overflow-wrap: break-word;
      }

      :host([wrap]) .code-line {
        white-space: pre-wrap;
        word-break: break-word;
      }

      /* No-copy: prevent text selection */
      :host([no-copy]) code {
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      :host([no-copy]) .code-line {
        user-select: none;
        -webkit-user-select: none;
      }
    `;
  }
  /**
   * Render a placeholder without syntax highlighting (for lazy loading)
   */
  renderPlaceholder() {
    const n = (this._codeContent || this.textContent).trim().split(`
`), r = this.startLine, o = this._sliceLines(n), b = o.map((E) => this.escapeHtml(E)).map((E) => `<span class="code-line">${E || " "}</span>`).join(""), h = this.showLines ? `<div class="line-numbers" aria-hidden="true">${o.map((E, S) => `<span>${r + S}</span>`).join("")}</div>` : "", u = this.filename ? `<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>` : `<span class="label">${this.escapeHtml(this.label)}</span>`;
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${u}
        </div>
        <div class="header-actions">
          <button class="copy-button" aria-label="${this.copyText}">${this.copyText}</button>
        </div>
      </div>
      <div class="code-wrapper">
        <div class="code-container">
          ${h}
          <pre><code class="hljs">${b}</code></pre>
        </div>
      </div>
    `;
    const f = this.shadowRoot.querySelector(".copy-button");
    f && f.addEventListener("click", () => this.copyCode());
  }
  /**
   * Attach event listeners to pre-rendered SSR shadow DOM without re-rendering.
   */
  _hydrateInteractivity() {
    const e = this.shadowRoot.querySelector(".copy-button");
    e && e.addEventListener("click", () => this.copyCode());
    const n = this.shadowRoot.querySelector(".expand-button");
    n && n.addEventListener("click", () => this.toggleCollapsed());
    const r = this.shadowRoot.querySelector(".share-button");
    r && r.addEventListener("click", (b) => {
      b.stopPropagation(), this.toggleShareMenu();
    });
    const o = this.shadowRoot.querySelector(".share-codepen");
    o && o.addEventListener("click", () => this.openInCodePen());
    const c = this.shadowRoot.querySelector(".download-button");
    c && c.addEventListener("click", () => this.downloadCode());
  }
  render() {
    const e = (this._codeContent || this.textContent).trim(), n = e.split(`
`), r = this.highlightLines, o = this.language === "diff", c = this.startLine, b = this.endLine, h = b && b >= c ? Math.min(n.length, b - c + 1) : n.length;
    let u;
    try {
      this.language && this.language !== "plaintext" && this.language !== "text" && this.language !== "txt" ? u = C.highlight(e, { language: this.language, ignoreIllegals: !0 }).value : u = this.escapeHtml(e);
    } catch {
      u = this.escapeHtml(e);
    }
    const E = Un(u).slice(0, h), S = n.slice(0, h), x = E.map((te, D) => {
      const U = c + D, Y = r.has(U), J = ["code-line"];
      if (Y && J.push("highlighted"), o) {
        const k = S[D] || "";
        k.startsWith("+") && !k.startsWith("+++") ? J.push("diff-add") : k.startsWith("-") && !k.startsWith("---") && J.push("diff-remove");
      }
      return `<span class="${J.join(" ")}">${te || " "}</span>`;
    }).join(""), A = this.showLines ? `<div class="line-numbers" aria-hidden="true">${E.map((te, D) => {
      const U = c + D, Y = r.has(U), J = [];
      if (Y && J.push("highlighted"), o) {
        const k = S[D] || "";
        k.startsWith("+") && !k.startsWith("+++") ? J.push("diff-add") : k.startsWith("-") && !k.startsWith("---") && J.push("diff-remove");
      }
      return `<span class="${J.join(" ")}">${U}</span>`;
    }).join("")}</div>` : "", M = this.filename ? `<span class="label">${this.escapeHtml(this.language.toUpperCase())}</span><span class="filename">${this.escapeHtml(this.filename)}</span>` : `<span class="label">${this.escapeHtml(this.label)}</span>`, N = this.hasAttribute("collapsed") || this.hasAttribute("max-lines"), B = E.length, $ = this.maxLines, P = N && B > $, W = this.collapsed, Q = W ? `calc(${$} * 1.6em + 2rem)` : "none", G = this.maxHeight ? `--cb-max-height: ${this.maxHeight};` : "", j = W ? `max-height: ${Q};` : "";
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="label-container" id="code-label">
          ${M}
        </div>
        <div class="header-actions">
          ${this.showShare ? `
            <div class="share-container">
              <button class="action-button share-button" title="Share code">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 12V3M8 3L5 6M8 3l3 3"/>
                  <path d="M3 9v4a1 1 0 001 1h8a1 1 0 001-1V9"/>
                </svg>
              </button>
              <div class="share-menu">
                ${typeof navigator < "u" && navigator.share ? `
                  <button class="share-menu-item share-native">
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <circle cx="12" cy="4" r="2"/>
                      <circle cx="4" cy="8" r="2"/>
                      <circle cx="12" cy="12" r="2"/>
                      <path d="M6 9l4 2M6 7l4-2"/>
                    </svg>
                    Share...
                  </button>
                ` : ""}
                <button class="share-menu-item share-codepen">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 0L0 5v6l8 5 8-5V5L8 0zM7 10.5L2 7.5v-2l5 3v2zm1-3l-5-3L8 2l5 2.5-5 3zm1 3v-2l5-3v2l-5 3z"/>
                  </svg>
                  Open in CodePen
                </button>
              </div>
            </div>
          ` : ""}
          ${this.showDownload ? `
            <button class="action-button download-button" title="Download code">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 1v10M8 11l-3-3M8 11l3-3"/>
                <path d="M2 12v2a1 1 0 001 1h10a1 1 0 001-1v-2"/>
              </svg>
            </button>
          ` : ""}
          ${this.noCopy ? "" : `<button class="copy-button"
                  aria-label="Copy code to clipboard"
                  title="Copy code">${this.escapeHtml(this.copyText)}</button>`}
        </div>
      </div>
      <div class="code-container" role="region" aria-labelledby="code-label" style="${G}${j}">
        ${A}
        <pre><code class="language-${this.language}" tabindex="0">${x}</code></pre>
      </div>
      ${P ? `
        <button class="expand-button" aria-expanded="${!W}">
          ${W ? `Show all ${B} lines` : "Show less"}
        </button>
      ` : ""}
    `, P ? this.setAttribute("data-expandable", "") : this.removeAttribute("data-expandable");
    const re = this.shadowRoot.querySelector(".copy-button");
    re && re.addEventListener("click", () => this.copyCode());
    const q = this.shadowRoot.querySelector(".expand-button");
    q && q.addEventListener("click", () => this.toggleCollapsed());
    const se = this.shadowRoot.querySelector(".share-button");
    se && se.addEventListener("click", (te) => {
      te.stopPropagation(), this.toggleShareMenu();
    });
    const oe = this.shadowRoot.querySelector(".share-native");
    oe && oe.addEventListener("click", () => this.shareViaWebAPI());
    const ie = this.shadowRoot.querySelector(".share-codepen");
    ie && ie.addEventListener("click", () => this.openInCodePen());
    const ce = this.shadowRoot.querySelector(".download-button");
    ce && ce.addEventListener("click", () => this.downloadCode());
  }
  toggleCollapsed() {
    this.collapsed ? this.removeAttribute("collapsed") : this.setAttribute("collapsed", "");
  }
  escapeHtml(e) {
    const n = document.createElement("div");
    return n.textContent = e, n.innerHTML;
  }
  _sliceLines(e) {
    const n = this.startLine, r = this.endLine, o = r && r >= n ? Math.min(e.length, r - n + 1) : e.length;
    return e.slice(0, o);
  }
  /**
   * Update the code content programmatically
   */
  setCode(e) {
    this._codeContent = e, this.render();
  }
  /**
   * Get the visible code content (respects start-line/end-line slicing).
   */
  getCode() {
    const e = (this._codeContent || this.textContent).trim();
    return !this.hasAttribute("start-line") && !this.hasAttribute("end-line") ? e : this._sliceLines(e.split(`
`)).join(`
`);
  }
  /**
   * Get list of supported languages
   */
  static getSupportedLanguages() {
    return C.listLanguages();
  }
}
customElements.define("code-block", Gn);
class jn extends HTMLElement {
  constructor() {
    super(), this.shadowRoot || this.attachShadow({ mode: "open" }), this._activeIndex = 0, this._showShareMenu = !1, this._handleOutsideClick = this._handleOutsideClick.bind(this);
  }
  connectedCallback() {
    requestAnimationFrame(() => {
      this.render(), this.setupEventListeners();
    }), We(this);
  }
  disconnectedCallback() {
    Nt(this), document.removeEventListener("click", this._handleOutsideClick);
  }
  static get observedAttributes() {
    return ["theme", "data-page-theme", "show-share", "show-download"];
  }
  attributeChangedCallback(e, n, r) {
    this.shadowRoot && n !== r && (e === "theme" && (this.hasAttribute("theme") ? this.removeAttribute("data-page-theme") : this._onPageModeChange(Pe())), this.render());
  }
  _onPageModeChange(e) {
    if (this.hasAttribute("theme")) {
      this.removeAttribute("data-page-theme");
      return;
    }
    e === !0 ? this.setAttribute("data-page-theme", "dark") : e === !1 ? this.setAttribute("data-page-theme", "light") : this.removeAttribute("data-page-theme");
  }
  get theme() {
    return this.getAttribute("theme") || this.getAttribute("data-page-theme") || "light";
  }
  get showShare() {
    return this.hasAttribute("show-share");
  }
  get showDownload() {
    return this.hasAttribute("show-download");
  }
  get codeBlocks() {
    return Array.from(this.querySelectorAll("code-block"));
  }
  get activeIndex() {
    return this._activeIndex;
  }
  set activeIndex(e) {
    const n = this.codeBlocks;
    e >= 0 && e < n.length && (this._activeIndex = e, this.updateActiveTab());
  }
  getStyles() {
    const e = this.theme === "dark";
    return `
      :host {
        /* Internal defaults — external --cb-* overrides always win */
        --_cb-bg: ${e ? "var(--color-surface-raised, #0d1117)" : "var(--color-surface-raised, #f6f8fa)"};
        --_cb-code-bg: ${e ? "var(--color-surface, #0d1117)" : "var(--color-surface, #fff)"};
        --_cb-header-bg: ${e ? "var(--color-surface-raised, #161b22)" : "var(--color-surface-raised, #e1e4e8)"};
        --_cb-text-color: ${e ? "var(--color-text, #c9d1d9)" : "var(--color-text, #24292e)"};
        --_cb-border-color: ${e ? "var(--color-border, #30363d)" : "var(--color-border, #e1e4e8)"};
        --_cb-comment: ${e ? "var(--color-text-muted, #8b949e)" : "var(--color-text-muted, #6a737d)"};
        --_cb-button-bg: ${e ? "#21262d" : "#fff"};
        --_cb-button-color: ${e ? "var(--color-text, #c9d1d9)" : "var(--color-text, #24292e)"};
        --_cb-scrollbar-track: ${e ? "#161b22" : "#f6f8fa"};
        --_cb-scrollbar-thumb: ${e ? "#30363d" : "#d1d5da"};

        display: block;
        margin: var(--cb-margin, 1rem 0);
        border-radius: var(--cb-border-radius, 8px);
        overflow: hidden;
        border: 1px solid var(--cb-border-color, var(--_cb-border-color));
        background: var(--cb-bg, var(--_cb-bg));
        font-family: var(--cb-font-family, 'Consolas', 'Monaco', 'Courier New', monospace);
        font-size: var(--cb-font-size, 0.875rem);
      }

      .tabs {
        display: flex;
        background: var(--cb-header-bg, var(--_cb-header-bg));
        border-bottom: 1px solid var(--cb-border-color, var(--_cb-border-color));
        overflow-x: auto;
        scrollbar-width: thin;
      }

      .tabs::-webkit-scrollbar {
        height: 4px;
      }

      .tabs::-webkit-scrollbar-thumb {
        background: var(--cb-scrollbar-thumb, var(--_cb-scrollbar-thumb));
        border-radius: var(--cb-button-radius, 4px);
      }

      .tab {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.625rem 1rem;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--cb-label-color, ${e ? "#8b949e" : "#57606a"});
        font-family: inherit;
        font-size: 0.8125rem;
        font-weight: 500;
        cursor: pointer;
        white-space: nowrap;
        transition: color 0.15s, border-color 0.15s, background 0.15s;
      }

      .tab:hover {
        color: var(--cb-text-color, var(--_cb-text-color));
        background: ${e ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"};
      }

      .tab:focus-visible {
        outline: 2px solid var(--cb-focus-color, ${e ? "#58a6ff" : "#0969da"});
        outline-offset: -2px;
      }

      .tab[aria-selected="true"] {
        color: var(--cb-text-color, var(--_cb-text-color));
        border-bottom-color: var(--cb-focus-color, ${e ? "#58a6ff" : "#0969da"});
        background: var(--cb-code-bg, var(--_cb-code-bg));
      }

      .language-badge {
        display: inline-block;
        padding: 0.125rem 0.375rem;
        background: ${e ? "rgba(110, 118, 129, 0.4)" : "rgba(175, 184, 193, 0.4)"};
        border-radius: var(--cb-button-radius, 4px);
        font-size: 0.6875rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.02em;
      }

      .content {
        position: relative;
      }

      ::slotted(code-block) {
        display: none !important;
        margin: 0 !important;
        border: none !important;
        border-radius: 0 !important;
      }

      ::slotted(code-block.active) {
        display: block !important;
      }

      /* Header with tabs and actions */
      .header {
        display: flex;
        align-items: stretch;
        background: var(--cb-header-bg, var(--_cb-header-bg));
        border-bottom: 1px solid var(--cb-border-color, var(--_cb-border-color));
      }

      .tabs {
        border-bottom: none;
      }

      .header-actions {
        display: flex;
        align-items: center;
        gap: 0.25rem;
        margin-left: auto;
        padding: 0 0.5rem;
      }

      .action-button {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 28px;
        height: 28px;
        padding: 0;
        background: transparent;
        border: none;
        border-radius: var(--cb-button-radius, 4px);
        color: var(--cb-label-color, ${e ? "#8b949e" : "#57606a"});
        cursor: pointer;
        transition: background 0.15s, color 0.15s;
      }

      .action-button:hover {
        background: var(--cb-action-button-hover-bg, ${e ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"});
        color: var(--cb-text-color, var(--_cb-text-color));
      }

      .action-button:focus-visible {
        outline: 2px solid var(--cb-focus-color, ${e ? "#58a6ff" : "#0969da"});
        outline-offset: 1px;
      }

      .action-button svg {
        width: 16px;
        height: 16px;
      }

      .share-container {
        position: relative;
      }

      .share-menu {
        position: absolute;
        top: 100%;
        right: 0;
        margin-top: 4px;
        min-width: 140px;
        padding: 0.25rem 0;
        background: var(--cb-bg, ${e ? "#21262d" : "#fff"});
        border: 1px solid var(--cb-border-color, var(--_cb-border-color));
        border-radius: var(--cb-menu-radius, 6px);
        box-shadow: var(--cb-shadow, 0 8px 24px ${e ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0.12)"});
        z-index: 100;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-4px);
        transition: opacity 0.15s, visibility 0.15s, transform 0.15s;
      }

      .share-menu.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }

      .share-menu-item {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        width: 100%;
        padding: 0.5rem 0.75rem;
        background: transparent;
        border: none;
        color: var(--cb-text-color, var(--_cb-text-color));
        font-family: inherit;
        font-size: 0.8125rem;
        text-align: left;
        cursor: pointer;
        transition: background 0.15s;
      }

      .share-menu-item:hover {
        background: ${e ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"};
      }

      .share-menu-item svg {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
      }
    `;
  }
  render() {
    const e = this.codeBlocks;
    if (e.length === 0) return;
    e.forEach((c, b) => {
      c.setAttribute("theme", this.theme), b === this._activeIndex ? c.classList.add("active") : c.classList.remove("active");
    });
    const n = e.map((c, b) => {
      const h = c.getAttribute("filename"), u = c.getAttribute("label"), f = c.getAttribute("language") || "plaintext", E = h || u || f.toUpperCase(), S = b === this._activeIndex;
      return `
        <button
          class="tab"
          role="tab"
          aria-selected="${S}"
          aria-controls="panel-${b}"
          tabindex="${S ? "0" : "-1"}"
          data-index="${b}"
        >
          <span class="tab-label">${this.escapeHtml(E)}</span>
          ${h ? `<span class="language-badge">${f}</span>` : ""}
        </button>
      `;
    }).join(""), o = this.showShare || this.showDownload ? `
      <div class="header-actions">
        ${this.showDownload ? `
          <button class="action-button download-button" aria-label="Download code" title="Download">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M2.75 14A1.75 1.75 0 0 1 1 12.25v-2.5a.75.75 0 0 1 1.5 0v2.5c0 .138.112.25.25.25h10.5a.25.25 0 0 0 .25-.25v-2.5a.75.75 0 0 1 1.5 0v2.5A1.75 1.75 0 0 1 13.25 14Z"/>
              <path d="M7.25 7.689V2a.75.75 0 0 1 1.5 0v5.689l1.97-1.969a.749.749 0 1 1 1.06 1.06l-3.25 3.25a.749.749 0 0 1-1.06 0L4.22 6.78a.749.749 0 1 1 1.06-1.06l1.97 1.969Z"/>
            </svg>
          </button>
        ` : ""}
        ${this.showShare ? `
          <div class="share-container">
            <button class="action-button share-button" aria-label="Share code" title="Share" aria-haspopup="true" aria-expanded="${this._showShareMenu}">
              <svg viewBox="0 0 16 16" fill="currentColor">
                <path d="M13.5 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15 3a3 3 0 0 1-5.175 2.066l-3.92 2.179a3.005 3.005 0 0 1 0 1.51l3.92 2.179a3 3 0 1 1-.73 1.31l-3.92-2.178a3 3 0 1 1 0-4.133l3.92-2.178A3 3 0 1 1 15 3Zm-1.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Zm-9-5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"/>
              </svg>
            </button>
            <div class="share-menu ${this._showShareMenu ? "open" : ""}" role="menu">
              ${typeof navigator < "u" && navigator.share ? `
                <button class="share-menu-item web-share-button" role="menuitem">
                  <svg viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.5 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0ZM15 3a3 3 0 0 1-5.175 2.066l-3.92 2.179a3.005 3.005 0 0 1 0 1.51l3.92 2.179a3 3 0 1 1-.73 1.31l-3.92-2.178a3 3 0 1 1 0-4.133l3.92-2.178A3 3 0 1 1 15 3Zm-1.5 10a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Zm-9-5a1.5 1.5 0 1 0-3 0 1.5 1.5 0 0 0 3 0Z"/>
                  </svg>
                  Share...
                </button>
              ` : ""}
              <button class="share-menu-item codepen-button" role="menuitem">
                <svg viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 0L0 5.333v5.334L8 16l8-5.333V5.333L8 0zm5.714 9.703L8 13.297l-5.714-3.594V6.297L8 2.703l5.714 3.594v3.406z"/>
                  <path d="M8 4.703L4.286 7.5 8 10.297 11.714 7.5 8 4.703z"/>
                </svg>
                Open in CodePen
              </button>
            </div>
          </div>
        ` : ""}
      </div>
    ` : "";
    this.shadowRoot.innerHTML = `
      <style>${this.getStyles()}</style>
      <div class="header">
        <div class="tabs" role="tablist" aria-label="Code files">
          ${n}
        </div>
        ${o}
      </div>
      <div class="content">
        <slot></slot>
      </div>
    `;
  }
  setupEventListeners() {
    const e = this.shadowRoot.querySelector(".tabs");
    if (!e) return;
    e.addEventListener("click", (b) => {
      const h = b.target.closest(".tab");
      if (h) {
        const u = parseInt(h.dataset.index, 10);
        this.activeIndex = u;
      }
    }), e.addEventListener("keydown", (b) => {
      const h = this.shadowRoot.querySelectorAll(".tab"), u = this._activeIndex;
      let f = u;
      switch (b.key) {
        case "ArrowLeft":
          f = u > 0 ? u - 1 : h.length - 1;
          break;
        case "ArrowRight":
          f = u < h.length - 1 ? u + 1 : 0;
          break;
        case "Home":
          f = 0;
          break;
        case "End":
          f = h.length - 1;
          break;
        default:
          return;
      }
      b.preventDefault(), this.activeIndex = f, h[f].focus();
    });
    const n = this.shadowRoot.querySelector(".download-button");
    n && n.addEventListener("click", () => this.downloadCode());
    const r = this.shadowRoot.querySelector(".share-button");
    r && r.addEventListener("click", (b) => {
      b.stopPropagation(), this.toggleShareMenu();
    });
    const o = this.shadowRoot.querySelector(".web-share-button");
    o && o.addEventListener("click", () => {
      this.shareViaWebAPI(), this.toggleShareMenu();
    });
    const c = this.shadowRoot.querySelector(".codepen-button");
    c && c.addEventListener("click", () => {
      this.openInCodePen(), this.toggleShareMenu();
    });
  }
  updateActiveTab() {
    const e = this.shadowRoot.querySelectorAll(".tab"), n = this.codeBlocks;
    e.forEach((r, o) => {
      const c = o === this._activeIndex;
      r.setAttribute("aria-selected", c), r.setAttribute("tabindex", c ? "0" : "-1");
    }), n.forEach((r, o) => {
      o === this._activeIndex ? r.classList.add("active") : r.classList.remove("active");
    }), this.dispatchEvent(
      new CustomEvent("tab-change", {
        detail: { index: this._activeIndex, block: n[this._activeIndex] },
        bubbles: !0
      })
    );
  }
  escapeHtml(e) {
    const n = document.createElement("div");
    return n.textContent = e, n.innerHTML;
  }
  /**
   * Programmatically select a tab by index
   */
  selectTab(e) {
    this.activeIndex = e;
  }
  /**
   * Get the currently active code block
   */
  getActiveBlock() {
    return this.codeBlocks[this._activeIndex];
  }
  /**
   * Toggle share menu visibility
   */
  toggleShareMenu() {
    this._showShareMenu = !this._showShareMenu;
    const e = this.shadowRoot.querySelector(".share-menu"), n = this.shadowRoot.querySelector(".share-button");
    e && e.classList.toggle("open", this._showShareMenu), n && n.setAttribute("aria-expanded", this._showShareMenu), this._showShareMenu ? document.addEventListener("click", this._handleOutsideClick) : document.removeEventListener("click", this._handleOutsideClick);
  }
  /**
   * Handle clicks outside share menu
   */
  _handleOutsideClick(e) {
    const n = this.shadowRoot.querySelector(".share-container");
    if (n && !e.composedPath().includes(n)) {
      this._showShareMenu = !1;
      const r = this.shadowRoot.querySelector(".share-menu"), o = this.shadowRoot.querySelector(".share-button");
      r && r.classList.remove("open"), o && o.setAttribute("aria-expanded", "false"), document.removeEventListener("click", this._handleOutsideClick);
    }
  }
  /**
   * Download code from the active block
   */
  downloadCode() {
    const e = this.getActiveBlock();
    e && typeof e.downloadCode == "function" && e.downloadCode();
  }
  /**
   * Open all blocks' code in CodePen (aggregates HTML, CSS, JS)
   */
  openInCodePen() {
    const e = this.codeBlocks;
    if (e.length === 0) return;
    let n = "", r = "", o = "", c = "Code Block Group";
    e.forEach((E) => {
      const S = E.language, x = E.getCode(), A = E.filename;
      ["html", "markup", "xhtml", "xml", "svg"].includes(S) ? (n && (n += `

`), A && (n += `<!-- ${A} -->
`), n += x) : S === "css" ? (r && (r += `

`), A && (r += `/* ${A} */
`), r += x) : ["javascript", "js"].includes(S) && (o && (o += `

`), A && (o += `// ${A}
`), o += x), (!c || c === "Code Block Group") && (c = A || E.label || "Code Block Group");
    });
    let b = "";
    b += n ? "1" : "0", b += r ? "1" : "0", b += o ? "1" : "0";
    const h = {
      title: c,
      description: "Code shared from code-block-group component",
      html: n,
      css: r,
      js: o,
      editors: b
    }, u = document.createElement("form");
    u.action = "https://codepen.io/pen/define", u.method = "POST", u.target = "_blank";
    const f = document.createElement("input");
    f.type = "hidden", f.name = "data", f.value = JSON.stringify(h), u.appendChild(f), document.body.appendChild(u), u.submit(), document.body.removeChild(u);
  }
  /**
   * Share all blocks' code via Web Share API
   */
  async shareViaWebAPI() {
    if (!navigator.share) return;
    const e = this.codeBlocks;
    if (e.length === 0) return;
    let n = "";
    e.forEach((r) => {
      const o = r.filename || r.label || r.language, c = r.getCode();
      n && (n += `

`), n += `// === ${o} ===
${c}`;
    });
    try {
      await navigator.share({
        title: "Code from code-block-group",
        text: n
      });
    } catch (r) {
      r.name !== "AbortError" && console.error("Share failed:", r);
    }
  }
}
customElements.define("code-block-group", jn);
export {
  Gn as CodeBlock,
  jn as CodeBlockGroup
};
