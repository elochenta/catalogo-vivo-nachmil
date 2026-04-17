const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://script.google.com/macros/s/AKfycbz6bxUen-XP2LnqcJSfVbjDlA5fHG2gOi-4hwGC62nk8EAmakT79HPKWGs434JArAUt/exec';

function normalize(text) {
  return (text || '').toString().toLowerCase();
}

export default function Home({ items, error }) {
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    if (!q) return items;
    return items.filter((it) => {
      return (
        normalize(it.nombre).includes(q) ||
        normalize(it.sku).includes(q) ||
        normalize(it.marca).includes(q) ||
        normalize(it.categorias || '').includes(q)
      );
    });
  }, [items, query]);

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <header className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Catálogo Vivo</h1>
            <p className="text-sm text-gray-600">
              Fuente: Google Sheets → Apps Script JSON endpoint.
            </p>
          </div>
          <a
            className="text-sm text-blue-600 hover:underline"
            href={API_URL}
            target="_blank"
            rel="noreferrer"
          >
            Ver JSON
          </a>
        </header>

        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
            No se pudo cargar el catálogo. Error: {error}
          </div>
        ) : (
          <>
            <div className="mb-6">
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Buscar por nombre, SKU, marca o categoría
              </label>
              <input
                className="w-full rounded-md border border-gray-200 px-3 py-2 focus:border-gray-400 focus:outline-none"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ej: zapatilla, SKU123, Nike, mujer"
              />
              <div className="mt-2 text-xs text-gray-500">
                {filtered.length} resultado{filtered.length === 1 ? '' : 's'}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((it) => {
                const firstImage = Array.isArray(it.imagenes) ? it.imagenes[0] : undefined;
                return (
                  <article key={it.sku} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100">
                      {firstImage ? (
                        <img src={firstImage} alt={it.nombre || 'Producto'} className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center text-xs text-gray-500">
                          Sin imagen
                        </div>
                      )}
                    </div>

                    <div className="mt-4">
                      <div className="flex items-start justify-between gap-2">
                        <h2 className="text-sm font-semibold leading-tight">{it.nombre}</h2>
                        {typeof it.precio_publico === 'number' ? (
                          <div className="text-sm font-bold text-green-700">
                            ${it.precio_publico.toLocaleString('es-AR', { minimumFractionDigits: 0 })}
                          </div>
                        ) : null}
                      </div>
                      <div className="mt-1 text-xs text-gray-500">SKU: {it.sku}</div>
                      <div className="mt-2 text-xs text-gray-600">
                        {it.marca} {it.categorias ? `· ${it.categorias}` : ''}
                      </div>
                      {it.descripcion ? (
                        <p className="mt-2 line-clamp-3 text-xs text-gray-500">{it.descripcion}</p>
                      ) : null}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                          {it.estado_revision || 'sin revisión'}
                        </span>
                        {typeof it.stock === 'number' ? (
                          <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-600">
                            Stock: {it.stock}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export async function getStaticProps() {
  const apiUrl = API_URL;
  try {
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const data = await res.json();

    return {
      props: {
        items: data.items || [],
        error: null,
      },
      revalidate: 60, // ISR: refresca cada 60s
    };
  } catch (e) {
    return {
      props: {
        items: [],
        error: e instanceof Error ? e.message : 'unknown',
      },
      revalidate: 60,
    };
  }
}
