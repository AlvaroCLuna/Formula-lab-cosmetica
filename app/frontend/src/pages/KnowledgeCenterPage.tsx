import { FormEvent, useEffect, useState } from "react";
import { api } from "../api/client";

export function KnowledgeCenterPage() {
  const [tab, setTab] = useState<"producto" | "familia" | "necesidad" | "glosario" | "aprendizaje">("producto");
  const [categories, setCategories] = useState<any[]>([]);
  const [families, setFamilies] = useState<any[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const [glossary, setGlossary] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [needDetail, setNeedDetail] = useState<any | null>(null);
  const [search, setSearch] = useState("cabello seco");
  const [results, setResults] = useState<any | null>(null);
  const [guided, setGuided] = useState<any | null>(null);
  const [message, setMessage] = useState("");

  async function load() {
    const [categoryResponse, familyResponse, needResponse, glossaryResponse] = await Promise.all([api.knowledgeCategories(), api.knowledgeFamilies(), api.knowledgeNeeds(), api.knowledgeGlossary()]);
    setCategories(categoryResponse.categories);
    setFamilies(familyResponse.families);
    setNeeds(needResponse.needs);
    setGlossary(glossaryResponse.terms);
    setSelected(categoryResponse.categories[0]?.products?.[0] ?? familyResponse.families[0] ?? null);
  }

  useEffect(() => { load().catch((error) => setMessage(error instanceof Error ? error.message : "No se pudo cargar el centro de conocimiento.")); }, []);

  async function doSearch(event: FormEvent) {
    event.preventDefault();
    setResults(await api.knowledgeSearch(search));
  }

  async function openNeed(need: any) {
    setSelected(need);
    setNeedDetail(await api.knowledgeNeed(need.id));
  }

  async function runGuided() {
    setGuided(await api.guidedKnowledgeSelection({ desiredOutcome: search, cosmeticNeed: search, usageZone: "Cabello" }));
  }

  const learningProduct = selected?.category ? selected : categories.flatMap((category) => category.products ?? [])[0];

  return (
    <main className="knowledge-center-page">
      <section className="module-hero">
        <div><p className="eyebrow">Incremento 7.5</p><h1>Centro de Conocimiento Cosmetico</h1><p>Busca por producto, familia o necesidad sin depender de terminologia tecnica.</p></div>
        <form className="create-formulation" onSubmit={doSearch}>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="quiero fabricar shampoo, cabello seco, emulsion..." />
          <button className="primary-button">Buscar</button>
          <button className="secondary-button" type="button" onClick={runGuided}>Seleccion guiada</button>
        </form>
      </section>
      {message ? <p className="module-message">{message}</p> : null}
      <nav className="knowledge-tabs">
        {(["producto", "familia", "necesidad", "glosario", "aprendizaje"] as const).map((item) => <button key={item} className={tab === item ? "active" : ""} onClick={() => setTab(item)}>{item}</button>)}
      </nav>
      <section className="knowledge-search-results">
        <article><strong>Productos</strong><span>{results?.products?.length ?? 0}</span></article>
        <article><strong>Familias</strong><span>{results?.families?.length ?? 0}</span></article>
        <article><strong>Necesidades</strong><span>{results?.needs?.length ?? 0}</span></article>
        {guided ? <article><strong>Guiada</strong><span>{guided.products.length} sugerencias</span></article> : null}
      </section>
      <div className="knowledge-center-grid">
        <section className="knowledge-browser">
          {tab === "producto" ? categories.map((category) => (
            <article key={category.id} className="knowledge-section">
              <h2>{category.name}</h2>
              <div className="knowledge-card-grid">{category.products.map((product: any) => <button key={product.id} className="knowledge-card" onClick={() => { setSelected(product); setNeedDetail(null); }}><strong>{product.name}</strong><span>{product.familyRelations?.[0]?.family?.name ?? "Familia pendiente"}</span><small>{product.difficulty}</small></button>)}</div>
            </article>
          )) : null}
          {tab === "familia" ? <div className="knowledge-card-grid">{families.map((family) => <button key={family.id} className="knowledge-card" onClick={() => { setSelected(family); setNeedDetail(null); }}><strong>{family.name}</strong><span>{family.simpleDefinition}</span><small>{family.difficulty}</small></button>)}</div> : null}
          {tab === "necesidad" ? <div className="knowledge-card-grid">{needs.map((need) => <button key={need.id} className="knowledge-card" onClick={() => openNeed(need)}><strong>{need.name}</strong><span>{need.area}</span><small>{need.difficulty}</small></button>)}</div> : null}
          {tab === "glosario" ? <div className="knowledge-card-grid">{glossary.map((term) => <article key={term.id} className="knowledge-card"><strong>{term.term}</strong><span>{term.simpleDefinition}</span><small>{term.family?.name ?? "Transversal"}</small></article>)}</div> : null}
          {tab === "aprendizaje" && learningProduct ? <article className="learning-lab"><h2>Como se fabrica: {learningProduct.name}</h2><p>{learningProduct.manufacturingOverview}</p><div className="knowledge-card-grid"><article><strong>Equipos</strong><span>{(learningProduct.usualEquipmentJson ?? []).join(", ")}</span></article><article><strong>Etapas</strong><span>{(learningProduct.processStagesJson ?? []).join(", ")}</span></article><article><strong>Errores comunes</strong><span>{(learningProduct.commonErrorsJson ?? []).join(", ")}</span></article><article><strong>Seguridad</strong><span>{learningProduct.safetyNotes}</span></article></div></article> : null}
        </section>
        <aside className="knowledge-side">
          <div className="section-heading"><h2>Aprendizaje</h2><span>{selected?.name ?? "Selecciona una ficha"}</span></div>
          {needDetail ? (
            <div className="quick-content">
              <h3>{needDetail.need.name}</h3>
              <p>{needDetail.need.description}</p>
              <h4>Productos recomendados</h4><p className="empty-inline">{needDetail.products.map((item: any) => item.name).join(", ")}</p>
              <h4>Familias</h4><p className="empty-inline">{needDetail.families.map((item: any) => item.name).join(", ")}</p>
              <h4>Ingredientes frecuentes</h4><p className="empty-inline">{needDetail.rawMaterials.map((item: any) => item.commonName).join(", ")}</p>
              <h4>Equipos y controles</h4><p className="empty-inline">{[...(needDetail.equipment ?? []), ...(needDetail.controls ?? [])].join(", ")}</p>
            </div>
          ) : selected ? (
            <div className="quick-content">
              <h3>{selected.name}</h3>
              <p>{selected.description ?? selected.simpleDefinition ?? selected.learningSummary}</p>
              <h4>Familia principal</h4><p className="empty-inline">{selected.familyRelations?.[0]?.family?.name ?? selected.productRelations?.[0]?.productType?.name ?? "Relacion registrada en catalogo"}</p>
              <h4>Terminos clave</h4><p className="empty-inline">{(selected.searchTerms ?? selected.glossaryTerms ?? []).map((item: any) => item.term).join(", ") || "Ver glosario cosmético."}</p>
              <button className="primary-button" onClick={() => setTab("aprendizaje")}>Ver explicacion completa</button>
            </div>
          ) : <p className="empty-state">Selecciona una ficha.</p>}
        </aside>
      </div>
    </main>
  );
}
