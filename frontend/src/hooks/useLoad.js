import { useCallback, useEffect, useRef, useState } from "react";

// Carrega dados da API e controla os três estados da tela: carregando, erro e pronto.
// `loader` precisa ser estável (useCallback): quando ele muda, a busca é refeita.
//
// - reload(): busca de novo mostrando "carregando" (usado no "Tentar novamente")
// - refresh(): busca de novo sem trocar a lista pelo "carregando" (usado depois de salvar)
export function useLoad(loader) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [version, setVersion] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    // version só existe para o reload() refazer a busca
    void version;
    let ignore = false;
    setLoading(true);
    setError(null);
    loader()
      .then((result) => {
        if (!ignore) {
          setData(result);
        }
      })
      .catch((failure) => {
        if (!ignore) {
          setError(failure.message);
        }
      })
      .finally(() => {
        if (!ignore) {
          setLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [loader, version]);

  const reload = useCallback(() => setVersion((current) => current + 1), []);

  // se falhar, o erro sobe para quem chamou mostrar na tela
  const refresh = useCallback(async () => {
    setData(await loaderRef.current());
  }, []);

  return { data, loading, error, reload, refresh };
}
