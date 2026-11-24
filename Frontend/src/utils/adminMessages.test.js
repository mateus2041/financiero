import {
  crearMensajeAdmin,
  normalizarMensajesAdmin,
} from "./adminMessages";

describe("admin message storage normalization", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("normalizes names and message text from untrusted browser storage", () => {
    const [mensaje] = normalizarMensajesAdmin([
      {
        id: "12",
        nombre_asesor: "<img src=x onerror=alert(1)>",
        texto: "<script>alert(1)</script> Hola",
      },
    ]);

    expect(mensaje.nombre_asesor).toBe("Sin nombre");
    expect(mensaje.texto).toBe("scriptalert(1)/script Hola");
    expect(mensaje.imagen).toBeNull();
  });

  test("rejects malformed message collections and unsafe image data", () => {
    expect(() => normalizarMensajesAdmin({})).toThrow(TypeError);
    const [mensaje] = normalizarMensajesAdmin([
      { texto: "mensaje", imagen: "data:text/html;base64,PHNjcmlwdD4=" },
    ]);
    expect(mensaje.imagen).toBeNull();
  });

  test("uses each message index when generating fallback identifiers", () => {
    jest.spyOn(Date, "now").mockReturnValue(100);

    expect(normalizarMensajesAdmin([{}, {}]).map(({ id }) => id)).toEqual([
      100,
      101,
    ]);
  });

  test("sanitizes newly created messages before persisting them", () => {
    localStorage.setItem("nombre_asesor", "<script>alert(1)</script>");

    expect(
      crearMensajeAdmin({
        texto: "<img src=x onerror=alert(1)>",
        imagen: "data:image/svg+xml;base64,PHN2Zz4=",
      })
    ).toMatchObject({
      nombre_asesor: "Sin nombre",
      texto: "img src=x onerror=alert(1)",
      imagen: null,
    });
  });
});
