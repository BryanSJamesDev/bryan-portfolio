import claims from "@/data/patent-demo.json";
const stop = new Set(["a", "an", "and", "the", "of", "to", "in", "from", "that", "with", "for", "using", "comprising", "configured", "based", "on"]);
const tokens = (s: string) => s.toLowerCase().match(/[a-z0-9]+/g)?.filter(t => !stop.has(t)) ?? [];
export function searchClaims(query: string) {
 const docs = claims.map(c => tokens(c.title + " " + c.text));
 const vocab = [...new Set(docs.flat())];
 const vector = (terms: string[]) => vocab.map(word => terms.filter(t => t === word).length * (Math.log((docs.length + 1) / (docs.filter(d => d.includes(word)).length + 1)) + 1));
 const q = vector(tokens(query));
 const norm = (v: number[]) => Math.sqrt(v.reduce((s,n)=>s+n*n,0));
 return claims.map((c,i) => { const v=vector(docs[i]); return {...c, score: norm(q) && norm(v) ? q.reduce((s,n,j)=>s+n*v[j],0)/(norm(q)*norm(v)) : 0}; }).filter(c=>c.score>0).sort((a,b)=>b.score-a.score).slice(0,3);
}
