// validators.js
// ---------- нормализация ----------
const lookalikeMap = {
  'А':'A','В':'B','Е':'E','К':'K','М':'M','Н':'H','О':'O','Р':'R','С':'S','Т':'T','У':'U','Х':'X','І':'I','Ї':'I','И':'I',
  'а':'A','в':'B','е':'E','к':'K','м':'M','н':'H','о':'O','р':'R','с':'S','т':'T','у':'U','х':'X','і':'I','ї':'I','и':'I',
  'Ⅰ':'I','｜':'|'
};
const mapLookalikes = (s) => s.replace(/./g, ch => lookalikeMap[ch] || ch);
const norm = (s) => mapLookalikes(String(s||''))
  .replace(/[\u200B-\u200D\uFEFF\u2060]/g,'')
  .trim().toUpperCase()
  .replace(/[–—]/g,'-')
  .replace(/\s+/g,' ');
const pad = (n,len) => String(n).padStart(len,'0');
const between = (x,a,b) => x>=a && x<=b;

// ---------- площадки ----------
const SITE = { M19:'M19', R:'R', T:'T', U:'U', K:'K' };
const SITE_PREFIX = { M19:'', R:'R', T:'T', U:'U', K:'K' }; // буква ряда
const SITE_FROM_CODE = (codeRaw) => {
  const c = norm(codeRaw).replace(/\s+/g,'');
  if (codeRaw ==='M19'  || c==='M19' || c==='М19') return SITE.M19;
  if (codeRaw ==='M70'  || c==='M70' || c==='М70') return SITE.R;
  if (codeRaw ==='ТАРА' || c==='ТАРА' || c==='T'  ) return SITE.T;
  if (codeRaw ==='К8'   || c==='К8'   || c==='K8' ) return SITE.K;
  if (codeRaw ==='УЗ'   || c==='УЗ'   || c==='UZ' ) return SITE.U;
  throw new Error('Неизвестный код площадки: '+codeRaw);
};

// ---------- правила (как раньше) ----------
const CELL_RULES = [
  // M19 — numeric
  { kind:'numeric', site:'M19', from:1,   to:41,  digits:3, tierMin:1, tierMax:9,  cellFrom:1,  cellTo:108 },
  { kind:'numeric', site:'M19', from:301, to:302, digits:3, tierMin:1, tierMax:5,  cellFrom:1,  cellTo:12  },
  { kind:'numeric', site:'M19', from:500, to:500, digits:3, tierMin:1, tierMax:7,  cellFrom:1,  cellTo:40  },
  { kind:'numeric', site:'M19', from:101, to:107, digits:3, tierMin:1, tierMax:6,  cellFrom:1,  cellTo:60  },
  { kind:'numeric', site:'M19', from:201, to:206, digits:3, tierMin:1, tierMax:4,  cellFrom:1,  cellTo:60  },
  { kind:'numeric', site:'M19', from:410, to:414, digits:3, tierMin:1, tierMax:8,  cellFrom:1,  cellTo:4   },
  // ТАРА — alpha
  { kind:'alpha', prefix:'T', from:1, to:24, digits:2, tierMin:1, tierMax:11, cellFrom:1, cellTo:108, site:'T' },
  { kind:'alphaExact', value:'SHT', tierMin:1, tierMax:7,  cellFrom:1, cellTo:70, site:'T' },
  { kind:'alphaExact', value:'S22', tierMin:7, tierMax:7,  cellFrom:1, cellTo:70, site:'T' },
  // М70 — alpha + часть numeric
  { kind:'alpha', prefix:'R', from:1,  to:31, digits:2, tierMin:1, tierMax:13, cellFrom:1,  cellTo:63, site:'R' },
  { kind:'alpha', prefix:'R', from:32, to:34, digits:2, tierMin:1, tierMax:5,  cellFrom:1,  cellTo:6,  site:'R' },
  { kind:'numeric', site:'R', from:160, to:164, digits:3, tierMin:1, tierMax:9,  cellFrom:1,  cellTo:138 },
  { kind:'numeric', site:'R', from:201, to:224, digits:3, tierMin:1, tierMax:4,  cellFrom:1,  cellTo:20  },
  { kind:'numeric', site:'R', from:300, to:315, digits:3, tierMin:1, tierMax:5,  cellFrom:1,  cellTo:12  },
  { kind:'numeric', site:'R', from:501, to:506, digits:3, tierMin:1, tierMax:10, cellFrom:1,  cellTo:92  },
  { kind:'numeric', site:'R', from:210, to:210, digits:3, tierMin:2, tierMax:3,  cellFrom:1,  cellTo:8   },
  // УЗ — alpha
  { kind:'alpha', prefix:'U', from:1,  to:31, digits:2, tierMin:1, tierMax:10, cellFrom:1,  cellTo:93, site:'U' },
  { kind:'alpha', prefix:'U', from:201, to:204, digits:3, tierMin:1, tierMax:5,  cellFrom:1, cellTo:40, site:'U' },
  { kind:'alpha', prefix:'U', from:301, to:304, digits:3, tierMin:1, tierMax:4,  cellFrom:1, cellTo:40, site:'U' },
  // К8 — alpha
  { kind:'alpha', prefix:'K', from:1,  to:24, digits:2, tierMin:1, tierMax:14, cellFrom:1,  cellTo:84, site:'K' },
  { kind:'alpha', prefix:'K', from:801, to:808, digits:3, tierMin:1, tierMax:7,  cellFrom:1,  cellTo:100, site:'K' },
  { kind:'alpha', prefix:'K', from:701, to:724, digits:3, tierMin:1, tierMax:3,  cellFrom:1,  cellTo:12,  site:'K' },
];

const CONSOLE_RULES = {
  M19: { kind:'numeric', from:1, to:41, digits:3 },
  T:   { kind:'alpha', prefix:'T', from:1, to:24, digits:2 },
  R:   { kind:'alpha', prefix:'R', from:1, to:31, digits:2 },
  U:   { kind:'alpha', prefix:'U', from:1, to:31, digits:2 },
  K:   { kind:'alpha', prefix:'K', from:1, to:24, digits:2 },
};

const GATE_RULES_BY_SITE = {
  M19: /^I(10[1-9]|110)$/,
  T:   /^I11[1-6]$/,
  R:   /^R21[1-4]$/,
  U:   /^U3[1-7]$/,
  K:   /^I20[1-8]$/,
};

// ---------- helpers ----------
const cellRuleMatch = (siteKey, rowRaw) => {
  // 1) спец-алфавитные (SHT/S22) — только для ТАРА
  if (/^[A-Z]{2,3}$/.test(rowRaw)) {
    return CELL_RULES.find(r => r.kind==='alphaExact' && r.site===siteKey && r.value===rowRaw);
  }
  // 2) буква+цифры
  if (/^[A-Z]\d+$/.test(rowRaw)) {
    const p = rowRaw[0];
    const num = Number(rowRaw.slice(1));
    return CELL_RULES.find(r =>
      r.site===siteKey &&
      r.kind==='alpha' && r.prefix===p && between(num, r.from, r.to)
    );
  }
  // 3) только цифры
  if (/^\d+$/.test(rowRaw)) {
    const num = Number(rowRaw);
    // для M19 — numeric; для T/R/U/K — alpha по их префиксу
    if (siteKey==='M19') {
      return CELL_RULES.find(r => r.site==='M19' && r.kind==='numeric' && between(num, r.from, r.to));
    } else {
      const pref = SITE_PREFIX[siteKey];
      return CELL_RULES.find(r => r.site===siteKey &&
        ((r.kind==='alpha' && r.prefix===pref && between(num, r.from, r.to))));
    }
  }
  return null;
};

// ---------- validators (siteCode обязателен) ----------
function validateCell(input, siteCode) {
  if (!siteCode) return { ok:false, errors:['Не передан код площадки'] };
  const site = SITE_FROM_CODE(siteCode);

  const s = norm(input);
  const parts = s.split(/[-\s]+/).filter(Boolean);
  if (parts.length !== 3) return { ok:false, errors:['Ожидается три части: Ряд–Ярус–Номер'] };

  let [rowRaw, tierRaw, cellRaw] = parts;

  if (!/^\d+$/.test(tierRaw)) return { ok:false, errors:['Ярус должен быть числом'] };
  const tier = Number(tierRaw);
  if (!/^\d{1,4}$/.test(cellRaw)) return { ok:false, errors:['Номер ячейки должен быть 1–4 цифры'] };
  const cellNum = Number(cellRaw);

  const rule = cellRuleMatch(site, rowRaw);
  if (!rule) return { ok:false, errors:['Ряд не попадает в диапазоны площадки '+siteCode] };

  // нормализуем ряд
  let rowNorm = rowRaw;
  if (rule.kind==='alpha') {
    const num = Number(rowRaw.replace(/^[A-Z]/,''));
    rowNorm = rule.prefix + pad(num, rule.digits);
  } else if (rule.kind==='numeric') {
    const num = Number(rowRaw);
    rowNorm = pad(num, rule.digits);
  } // alphaExact — уже норм

  const errs = [];
  if (!between(tier, rule.tierMin, rule.tierMax)) errs.push(`Ярус вне диапазона: ${rule.tierMin}–${rule.tierMax}`);
  if (!between(cellNum, rule.cellFrom, rule.cellTo)) {
    const from = pad(rule.cellFrom, 3);
    const to   = pad(rule.cellTo,   String(rule.cellTo).length>3 ? 4 : 3);
    errs.push(`Номер ячейки вне диапазона: ${from}–${to}`);
  }
  const cellNorm = (String(cellNum).length>3) ? pad(cellNum,4) : pad(cellNum,3);

  return {
    ok: errs.length===0,
    normalized: `${rowNorm}-${tier}-${cellNorm}`,
    site,
    siteCode: siteCode,
    row: rowNorm,
    tier,
    cell: cellNorm,
    errors: errs.length?errs:undefined,
  };
}

function validateConsole(input, siteCode) {
  if (!siteCode) return { ok:false, errors:['Не передан код площадки'] };
  const site = SITE_FROM_CODE(siteCode);
  const rule = CONSOLE_RULES[site];
  const s = norm(input).replace(/[-\s]+/g,''); // убираем разделители

  // допускаем как "T02" так и "02" для площадок с префиксом
  if (site==='M19') {
    if (!/^\d+$/.test(s)) return { ok:false, errors:['Для М19 консоль — только цифры'] };
    const num = Number(s);
    if (!between(num, rule.from, rule.to)) return { ok:false, errors:['Консоль вне диапазона 001–041'] };
    return { ok:true, normalized: pad(num, rule.digits), site, siteCode };
  } else {
    let num;
    if (/^[A-Z]\d+$/.test(s)) {
      if (s[0]!==rule.prefix) return { ok:false, errors:[`Ожидается префикс ${rule.prefix}`] };
      num = Number(s.slice(1));
    } else if (/^\d+$/.test(s)) {
      num = Number(s);
    } else {
      return { ok:false, errors:['Некорректный формат консоли'] };
    }
    if (!between(num, rule.from, rule.to)) return { ok:false, errors:[`Консоль вне диапазона ${rule.prefix}${pad(rule.from, rule.digits)}–${rule.prefix}${pad(rule.to, rule.digits)}`] };
    return { ok:true, normalized: rule.prefix + pad(num, rule.digits), site, siteCode };
  }
}

function validateGate(input, siteCode) {
  if (!siteCode) return { ok:false, errors:['Не передан код площадки'] };
  const site = SITE_FROM_CODE(siteCode);
  const pattern = GATE_RULES_BY_SITE[site];
  const s = norm(input).replace(/[-\s]+/g,'');
  if (!/^[A-Z]\d{2,3}$/.test(s)) return { ok:false, errors:['Неверный формат ворот'] };
  if (!pattern.test(s)) {
    const hint = {
      M19:'I101–I110',
      T:'I111–I116',
      R:'R211–R214',
      U:'U31–U37',
      K:'I201–I208',
    }[site];
    return { ok:false, errors:[`Ворота не попадают в диапазон площадки ${siteCode} (${hint})`] };
  }
  return { ok:true, normalized:s, site, siteCode };
}

// Авто-определение типа ВНУТРИ площадки
export const validateAuto = function(input, siteCode) {
  const s = norm(input);
  // cell? (три блока)
  if (/^[A-Z0-9]+[-\s]+[0-9]+[-\s]+[0-9]+$/.test(s)) {
    const r = validateCell(s, siteCode); return { type:'cell', ...r };
  }
  // gate?
  const gate = validateGate(s, siteCode);
  if (gate.ok) return { type:'gate', ...gate };
  // иначе — console
  const con = validateConsole(s, siteCode);
  return { type:'console', ...con };
}

