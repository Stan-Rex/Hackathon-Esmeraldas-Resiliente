
import tkinter as tk
from tkinter import ttk
import pandas as pd
import joblib
from datetime import datetime
import os
from matplotlib.figure import Figure
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet
from tkinter import filedialog, messagebox
from reportlab.graphics.shapes import Drawing
from reportlab.graphics.charts.barcharts import VerticalBarChart
from reportlab.platypus import PageBreak, KeepTogether
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.styles import ParagraphStyle
# ==========================================
# MODULO 6 - IA & DATOS
# SISTEMA DE PREDICCION DE INCIDENTES
# ==========================================

# Cargar modelo entrenado
modelo = joblib.load("modelos/modelo_prioridad.pkl")
# Archivo donde se guardara el historial
RUTA_HISTORIAL = "datos/historial_predicciones.csv"
# Colores
FONDO = "#101827"
PANEL = "#1E293B"
AZUL = "#2563EB"
BLANCO = "#FFFFFF"
GRIS = "#CBD5E1"

# Ventana principal
ventana = tk.Tk()
ventana.title("ESMERALDAS RESILIENTE | IA Y ANALÍTICA")
ventana.geometry("950x850")
ventana.minsize(750, 600)
ventana.configure(bg="#0F172A")

# Área desplazable
contenedor = tk.Frame(ventana, bg="#0F172A")
contenedor.pack(fill="both", expand=True)

canvas = tk.Canvas(
    contenedor,
    bg="#0F172A",
    highlightthickness=0
)
canvas.pack(side="left", fill="both", expand=True)

barra = ttk.Scrollbar(
    contenedor,
    orient="vertical",
    command=canvas.yview
)
barra.pack(side="right", fill="y")

canvas.configure(yscrollcommand=barra.set)

# Panel que contendrá todos los elementos
contenido_principal = tk.Frame(
    canvas,
    bg="#0F172A"
)

ventana_canvas = canvas.create_window(
    (0, 0),
    window=contenido_principal,
    anchor="nw"
)

def actualizar_area(event):
    canvas.configure(scrollregion=canvas.bbox("all"))

def ajustar_ancho(event):
    canvas.itemconfig(ventana_canvas, width=event.width)

contenido_principal.bind("<Configure>", actualizar_area)
canvas.bind("<Configure>", ajustar_ancho)

# Desplazamiento con la rueda del ratón
def desplazar_rueda(event):
    canvas.yview_scroll(int(-event.delta / 120), "units")

canvas.bind_all("<MouseWheel>", desplazar_rueda)
# Desplazamiento con las flechas del teclado
def desplazar_teclado(event):
    if event.keysym == "Down":
        canvas.yview_scroll(1, "units")
    elif event.keysym == "Up":
        canvas.yview_scroll(-1, "units")

ventana.bind_all("<Up>", desplazar_teclado)
ventana.bind_all("<Down>", desplazar_teclado)

# Estilo moderno de los controles
estilo = ttk.Style()
estilo.theme_use("clam")

estilo.configure(
    "TCombobox",
    fieldbackground="#F8FAFC",
    background="#38BDF8",
    foreground="#0F172A",
    arrowcolor="#0F172A",
    padding=12,
    font=("Segoe UI", 11)
)

estilo.map(
    "TCombobox",
    fieldbackground=[("readonly", "#F8FAFC")],
    selectbackground=[("readonly", "#F8FAFC")],
    selectforeground=[("readonly", "#0F172A")]
)

# Encabezado
# Encabezado principal
encabezado = tk.Frame(contenido_principal, bg="#1E293B", height=130)
encabezado.pack(fill="x", padx=25, pady=(25, 20))
encabezado.pack_propagate(False)

titulo = tk.Label(
    encabezado,
    text="ESMERALDAS RESILIENTE",
    font=("Segoe UI", 23, "bold"),
    fg="#F8FAFC",
    bg="#1E293B"
)
titulo.pack(pady=(22, 5))

subtitulo = tk.Label(
    encabezado,
    text="SISTEMA INTELIGENTE DE ANÁLISIS DE INCIDENTES",
    font=("Segoe UI", 10),
    fg="#38BDF8",
    bg="#1E293B"
)
subtitulo.pack()

# Panel principal de selección
panel = tk.Frame(
    contenido_principal,
    bg="#1E293B",
    padx=40,
    pady=30,
    highlightbackground="#334155",
    highlightthickness=1
)
panel.pack(padx=80, pady=10, fill="x")

tk.Label(
    panel,
    text="NUEVA EVALUACIÓN",
    font=("Segoe UI", 16, "bold"),
    bg="#1E293B",
    fg="#F8FAFC"
).pack(anchor="w", pady=(0, 8))

tk.Label(
    panel,
    text="Ingrese los datos del incidente para estimar su prioridad.",
    font=("Segoe UI", 9),
    bg="#1E293B",
    fg="#94A3B8"
).pack(anchor="w", pady=(0, 20))

# Selección de zona
tk.Label(
    panel,
    text="📍  SELECCIONE LA ZONA",
    font=("Segoe UI", 10, "bold"),
    bg="#1E293B",
    fg="#38BDF8"
).pack(anchor="w", pady=(5, 10))
zonas = [
    "Esmeraldas Centro",
    "Las Palmas",
    "Tachina",
    "Atacames",
    "Rioverde"
]

zona_seleccionada = ttk.Combobox(
    panel,
    values=zonas,
    state="readonly",
    font=("Arial", 11),
    width=40
)
zona_seleccionada.pack(fill="x")
zona_seleccionada.set("Esmeraldas Centro")

# Selección del incidente
tk.Label(
    panel,
    text="⚠️  TIPO DE INCIDENTE",
    font=("Segoe UI", 10, "bold"),
    bg="#1E293B",
    fg="#38BDF8"
).pack(anchor="w", pady=(22, 10))

tipos = [
    "Inundacion",
    "Deslizamiento",
    "Incendio"
]

tipo_seleccionado = ttk.Combobox(
    panel,
    values=tipos,
    state="readonly",
    font=("Arial", 11),
    width=40
)
tipo_seleccionado.pack(fill="x")
tipo_seleccionado.set("Inundacion")

# Tarjeta de resultados
tarjeta_resultado = tk.Frame(
    contenido_principal,
    bg="#1E293B",
    padx=30,
    pady=20,
    highlightbackground="#334155",
    highlightthickness=1
)
tarjeta_resultado.pack(fill="x", padx=80, pady=(20, 10))

tk.Label(
    tarjeta_resultado,
    text="RESULTADO DEL ANÁLISIS",
    font=("Segoe UI", 11, "bold"),
    bg="#1E293B",
    fg="#38BDF8"
).pack(pady=(0, 12))

etiqueta_resultado = tk.Label(
    tarjeta_resultado,
    text="ESPERANDO PREDICCIÓN...",
    font=("Segoe UI", 17, "bold"),
    bg="#1E293B",
    fg="#94A3B8"
)
etiqueta_resultado.pack(pady=5)
# Información del incidente
detalle_resultado = tk.Label(
    tarjeta_resultado,
    text="Aquí aparecerán los detalles del incidente",
    font=("Segoe UI", 10),
    bg="#1E293B",
    fg="#CBD5E1",
    justify="center",
    wraplength=620
)
detalle_resultado.pack(pady=(10, 5))

# Función de predicción
def predecir():
    nuevo_incidente = pd.DataFrame({
        "zona": [zona_seleccionada.get()],
        "tipo_incidente": [tipo_seleccionado.get()]
    })

    resultado = modelo.predict(nuevo_incidente)[0]
    # Registrar prediccion en el historial
    registro = pd.DataFrame([{
        "fecha_hora": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "zona": zona_seleccionada.get(),
        "tipo_incidente": tipo_seleccionado.get(),
        "prioridad_estimada": resultado
    }])

    registro.to_csv(
        RUTA_HISTORIAL,
        mode="a",
        header=not os.path.exists(RUTA_HISTORIAL),
        index=False
    )
    colores = {
        "Alta": "#EF4444",
        "Media": "#F59E0B",
        "Baja": "#22C55E"
        
    }
    recomendaciones = {
        "Alta": "ATENCIÓN: Este incidente requiere evaluación prioritaria por las autoridades competentes.",
        "Media": "SEGUIMIENTO: Este incidente requiere monitoreo y evaluación.",
        "Baja": "PREVENCIÓN: Mantener vigilancia y medidas preventivas."
    }

    etiqueta_resultado.config(
        text=f"PRIORIDAD ESTIMADA: {resultado.upper()}",
        fg=colores.get(resultado, BLANCO)
    )
    detalle_resultado.config(
        text=f"Zona: {zona_seleccionada.get()}\n"
             f"Incidente: {tipo_seleccionado.get()}\n"
             f"Evaluación realizada correctamente\n\n"
             f"{recomendaciones.get(resultado, '')}"
    )

    # Funcion para limpiar el formulario
def limpiar():
    zona_seleccionada.set("")
    tipo_seleccionado.set("")

    etiqueta_resultado.config(
        text="ESPERANDO PREDICCION",
        fg=BLANCO
    )

    detalle_resultado.config(text="")
# Funcion para agregar pie de pagina y numeracion
def agregar_pie_pagina(canvas, documento):
    canvas.saveState()

    ancho, alto = documento.pagesize

    if documento.page > 1:
        canvas.setStrokeColor(colors.HexColor("#CBD5E1"))
        canvas.line(40, 30, ancho - 40, 30)

        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#64748B"))

        canvas.drawString(
            40,
            18,
            "ESMERALDAS RESILIENTE | IA Y ANALITICA"
        )

        canvas.drawRightString(
            ancho - 40,
            18,
            f"Pagina {documento.page}"
        )

    canvas.restoreState()
# Funcion para exportar el historial a PDF
def exportar_pdf():

    if not os.path.exists(RUTA_HISTORIAL):
        messagebox.showinfo(
            "Exportar PDF",
            "Todavia no existen predicciones guardadas."
        )
        return

    historial = pd.read_csv(RUTA_HISTORIAL)

    ruta = filedialog.asksaveasfilename(
        defaultextension=".pdf",
        filetypes=[("Archivos PDF", "*.pdf")],
        title="Guardar historial en PDF",
        initialfile="historial_predicciones.pdf"
    )

    if not ruta:
        return

    documento = SimpleDocTemplate(
        ruta,
        pagesize=landscape(A4)
    )

    estilos = getSampleStyleSheet()
    contenido = []
    # Estilos personalizados del informe
    estilo_portada = ParagraphStyle(
        "Portada",
        parent=estilos["Title"],
        fontSize=26,
        textColor=colors.HexColor("#1E3A8A"),
        alignment=TA_CENTER,
        spaceAfter=20
    )

    estilo_subtitulo = ParagraphStyle(
        "Subtitulo",
        parent=estilos["Heading2"],
        fontSize=16,
        textColor=colors.HexColor("#2563EB"),
        alignment=TA_CENTER,
        spaceAfter=15
    )

    estilo_centrado = ParagraphStyle(
        "Centrado",
        parent=estilos["Normal"],
        alignment=TA_CENTER,
        fontSize=12
    )
    
    # PORTADA DEL INFORME
    contenido.append(Spacer(1, 90))

    contenido.append(
        Paragraph(
            "ESMERALDAS RESILIENTE",
            estilo_portada
        )
    )

    contenido.append(
        Paragraph(
            "IA Y ANALITICA",
            estilo_subtitulo
        )
    )

    contenido.append(Spacer(1, 35))

    contenido.append(
        Paragraph(
            "INFORME DE PREDICCIONES<br/>"
            "Y ANALISIS DE INCIDENTES",
            estilo_portada
        )
    )

    contenido.append(Spacer(1, 35))

    contenido.append(
        Paragraph(
            "Sistema académico de análisis y estimación "
            "de prioridades de incidentes",
            estilo_centrado
        )
    )

    contenido.append(Spacer(1, 60))

    contenido.append(
        Paragraph(
            f"Fecha de generación: "
            f"{datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
            estilo_centrado
        )
    )

    contenido.append(Spacer(1, 100))

    contenido.append(
        Paragraph(
            "PROTOTIPO ACADEMICO - DATOS FICTICIOS",
            estilo_subtitulo
        )
    )

    contenido.append(PageBreak())

    contenido.append(
        Paragraph(
            "RESUMEN DEL INFORME",
            estilos["Heading1"]
        )
    )

    

    contenido.append(Spacer(1, 15))

    contenido.append(
        Paragraph(
            f"Fecha de generacion: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}",
            estilos["Normal"]
        )
    )

    contenido.append(Spacer(1, 15))

    contenido.append(
        Paragraph(
            f"Total de predicciones: {len(historial)}",
            estilos["Heading2"]
        )
    )
            # Resumen de prioridades
    total_altas = int(
        (historial["prioridad_estimada"] == "Alta").sum()
    )

    total_medias = int(
        (historial["prioridad_estimada"] == "Media").sum()
    )

    total_bajas = int(
        (historial["prioridad_estimada"] == "Baja").sum()
    )

    contenido.append(Spacer(1, 10))

    contenido.append(
        Paragraph(
            f"Prioridad Alta: {total_altas}",
            estilos["Normal"]
        )
    )

    contenido.append(
        Paragraph(
            f"Prioridad Media: {total_medias}",
            estilos["Normal"]
        )
    )

    contenido.append(
        Paragraph(
            f"Prioridad Baja: {total_bajas}",
            estilos["Normal"]
        )
    )

    contenido.append(Spacer(1, 20))
    

    contenido.append(Spacer(1, 15))

    datos = [[
        "Fecha y hora",
        "Zona",
        "Tipo de incidente",
        "Prioridad estimada"
    ]]

    for _, fila in historial.iterrows():
        datos.append([
            str(fila["fecha_hora"]),
            str(fila["zona"]),
            str(fila["tipo_incidente"]),
            str(fila["prioridad_estimada"])
        ])

    tabla = Table(
        datos,
        colWidths=[150, 170, 170, 150],
        repeatRows=1
    )

    tabla.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1),
         [colors.white, colors.HexColor("#DBEAFE")])
    ]))

    contenido.append(tabla)
    contenido.append(Spacer(1, 20))

    # Grafico estadistico de prioridades
    contenido.append(
        Paragraph(
            "ESTADISTICAS DE PRIORIDADES",
            estilos["Heading2"]
        )
    )

    contenido.append(Spacer(1, 10))

    prioridades = ["Alta", "Media", "Baja"]

    cantidades = [
        int((historial["prioridad_estimada"] == prioridad).sum())
        for prioridad in prioridades
    ]

    dibujo = Drawing(500, 250)

    grafico = VerticalBarChart()
    grafico.x = 65
    grafico.y = 40
    grafico.height = 170
    grafico.width = 390

       # Datos separados para colorear cada prioridad
    grafico.data = [
        [cantidades[0], 0, 0],
        [0, cantidades[1], 0],
        [0, 0, cantidades[2]]
    ]

    # Colores de las prioridades
    grafico.bars[0].fillColor = colors.HexColor("#EF4444")
    grafico.bars[1].fillColor = colors.HexColor("#F59E0B")
    grafico.bars[2].fillColor = colors.HexColor("#22C55E")
    grafico.categoryAxis.categoryNames = prioridades

    grafico.valueAxis.valueMin = 0
    grafico.valueAxis.valueMax = max(cantidades + [1]) + 1
    grafico.valueAxis.valueStep = 1

       # Datos separados para colorear cada prioridad
    grafico.data = [
        [cantidades[0], 0, 0],
        [0, cantidades[1], 0],
        [0, 0, cantidades[2]]
    ]

    # Colores de las prioridades
    grafico.bars[0].fillColor = colors.HexColor("#EF4444")
    grafico.bars[1].fillColor = colors.HexColor("#F59E0B")
    grafico.bars[2].fillColor = colors.HexColor("#22C55E")

    dibujo.add(grafico)
    contenido.append(dibujo)

    contenido.append(Spacer(1, 20))


    contenido.append(
        Paragraph(
            "Nota: Este documento contiene datos ficticios "
            "generados para un prototipo academico. "
            "Las predicciones no sustituyen la evaluacion "
            "de las autoridades competentes.",
            estilos["Italic"]
        )
    )

    documento.build(
        contenido,
        onFirstPage=agregar_pie_pagina,
        onLaterPages=agregar_pie_pagina
    )

    messagebox.showinfo(
        "PDF generado",
        "El historial se exporto correctamente."
    )

# ==========================================
# FUNCION PARA MOSTRAR EL HISTORIAL
# ==========================================


def mostrar_historial():

    if not os.path.exists(RUTA_HISTORIAL):
        tk.messagebox.showinfo(
            "Historial",
            "Todavia no existen predicciones guardadas."
        )
        return

    historial = pd.read_csv(RUTA_HISTORIAL)

    ventana_historial = tk.Toplevel(ventana)
    ventana_historial.title("Historial de predicciones")
    ventana_historial.geometry("900x550")
    ventana_historial.configure(bg=FONDO)

    tk.Label(
        ventana_historial,
        text="HISTORIAL DE PREDICCIONES",
        font=("Arial", 18, "bold"),
        bg=FONDO,
        fg=BLANCO
    ).pack(pady=15)

    # Panel de filtros
    panel_filtros = tk.Frame(
        ventana_historial,
        bg=PANEL,
        padx=15,
        pady=15
    )
    panel_filtros.pack(fill="x", padx=20, pady=10)

    tk.Label(
        panel_filtros,
        text="Zona:",
        bg=PANEL,
        fg=BLANCO
    ).grid(row=0, column=0, padx=5)

    filtro_zona = ttk.Combobox(
        panel_filtros,
        values=["Todas"] + sorted(
            historial["zona"].dropna().unique().tolist()
        ),
        state="readonly",
        width=18
    )
    filtro_zona.grid(row=0, column=1, padx=5)
    filtro_zona.set("Todas")

    tk.Label(
        panel_filtros,
        text="Incidente:",
        bg=PANEL,
        fg=BLANCO
    ).grid(row=0, column=2, padx=5)

    filtro_tipo = ttk.Combobox(
        panel_filtros,
        values=["Todos"] + sorted(
            historial["tipo_incidente"].dropna().unique().tolist()
        ),
        state="readonly",
        width=18
    )
    filtro_tipo.grid(row=0, column=3, padx=5)
    filtro_tipo.set("Todos")

    tk.Label(
        panel_filtros,
        text="Prioridad:",
        bg=PANEL,
        fg=BLANCO
    ).grid(row=0, column=4, padx=5)

    filtro_prioridad = ttk.Combobox(
        panel_filtros,
        values=["Todas", "Alta", "Media", "Baja"],
        state="readonly",
        width=12
    )
    filtro_prioridad.grid(row=0, column=5, padx=5)
    filtro_prioridad.set("Todas")

    # Tabla de resultados
    columnas = (
        "fecha_hora",
        "zona",
        "tipo_incidente",
        "prioridad_estimada"
    )

    tabla = ttk.Treeview(
        ventana_historial,
        columns=columnas,
        show="headings"
    )

    tabla.heading("fecha_hora", text="FECHA Y HORA")
    tabla.heading("zona", text="ZONA")
    tabla.heading("tipo_incidente", text="INCIDENTE")
    tabla.heading("prioridad_estimada", text="PRIORIDAD")

    tabla.column("fecha_hora", width=190)
    tabla.column("zona", width=200)
    tabla.column("tipo_incidente", width=200)
    tabla.column("prioridad_estimada", width=150)

    tabla.pack(fill="both", expand=True, padx=20, pady=10)
    boton_pdf = tk.Button(
        ventana_historial,
        text="DESCARGAR HISTORIAL EN PDF",
        command=exportar_pdf,
        font=("Arial", 11, "bold"),
        bg="#DC2626",
        fg=BLANCO,
        relief="flat",
        cursor="hand2",
        padx=15,
        pady=8
    )

    boton_pdf.pack(pady=10)
    # Funcion para actualizar la tabla
    def aplicar_filtros():

        datos_filtrados = historial.copy()

        if filtro_zona.get() != "Todas":
            datos_filtrados = datos_filtrados[
                datos_filtrados["zona"] == filtro_zona.get()
            ]

        if filtro_tipo.get() != "Todos":
            datos_filtrados = datos_filtrados[
                datos_filtrados["tipo_incidente"] == filtro_tipo.get()
            ]

        if filtro_prioridad.get() != "Todas":
            datos_filtrados = datos_filtrados[
                datos_filtrados["prioridad_estimada"] == filtro_prioridad.get()
            ]

        for elemento in tabla.get_children():
            tabla.delete(elemento)

        for _, fila in datos_filtrados.iterrows():
            tabla.insert(
                "",
                "end",
                values=(
                    fila["fecha_hora"],
                    fila["zona"],
                    fila["tipo_incidente"],
                    fila["prioridad_estimada"]
                )
            )

        etiqueta_total.config(
            text=f"Registros encontrados: {len(datos_filtrados)}"
        )

    # Botones de filtros
    tk.Button(
        panel_filtros,
        text="BUSCAR",
        command=aplicar_filtros,
        bg=AZUL,
        fg=BLANCO,
        relief="flat",
        cursor="hand2",
        padx=12
    ).grid(row=1, column=1, columnspan=2, pady=12)

    tk.Button(
        panel_filtros,
        text="LIMPIAR FILTROS",
        command=lambda: (
            filtro_zona.set("Todas"),
            filtro_tipo.set("Todos"),
            filtro_prioridad.set("Todas"),
            aplicar_filtros()
        ),
        bg="#475569",
        fg=BLANCO,
        relief="flat",
        cursor="hand2",
        padx=12
    ).grid(row=1, column=3, columnspan=2, pady=12)

    etiqueta_total = tk.Label(
        ventana_historial,
        text="",
        font=("Arial", 10, "bold"),
        bg=FONDO,
        fg=GRIS
    )
    etiqueta_total.pack(pady=8)

    aplicar_filtros()


# ==========================================
# FUNCION PARA MOSTRAR ESTADISTICAS
# ==========================================

def mostrar_estadisticas():

    if not os.path.exists(RUTA_HISTORIAL):
        tk.messagebox.showinfo(
            "Estadisticas",
            "Todavia no existen predicciones guardadas."
        )
        return

    historial = pd.read_csv(RUTA_HISTORIAL)

    total = len(historial)

    prioridades = historial["prioridad_estimada"].value_counts()

    alta = prioridades.get("Alta", 0)
    media = prioridades.get("Media", 0)
    baja = prioridades.get("Baja", 0)

    ventana_estadisticas = tk.Toplevel(ventana)
    ventana_estadisticas.title("Estadisticas del sistema")
    ventana_estadisticas.geometry("750x600")
    ventana_estadisticas.configure(bg=FONDO)

    tk.Label(
        ventana_estadisticas,
        text="ESTADISTICAS DEL SISTEMA",
        font=("Arial", 18, "bold"),
        bg=FONDO,
        fg=BLANCO
    ).pack(pady=20)

    # Total de predicciones
    tk.Label(
        ventana_estadisticas,
        text=f"TOTAL DE PREDICCIONES: {total}",
        font=("Arial", 14, "bold"),
        bg=PANEL,
        fg=BLANCO,
        padx=20,
        pady=15
    ).pack(fill="x", padx=40, pady=10)

    # Resumen de prioridades
    resumen = tk.Frame(ventana_estadisticas, bg=FONDO)
    resumen.pack(pady=15)

    tk.Label(
        resumen,
        text=f"ALTA: {alta}",
        font=("Arial", 12, "bold"),
        bg=FONDO,
        fg="#EF4444"
    ).pack(side="left", padx=20)

    tk.Label(
        resumen,
        text=f"MEDIA: {media}",
        font=("Arial", 12, "bold"),
        bg=FONDO,
        fg="#F59E0B"
    ).pack(side="left", padx=20)

    tk.Label(
        resumen,
        text=f"BAJA: {baja}",
        font=("Arial", 12, "bold"),
        bg=FONDO,
        fg="#22C55E"
    ).pack(side="left", padx=20)

    # Crear grafico
    figura = Figure(figsize=(6, 3.5), dpi=100)
    grafico = figura.add_subplot(111)

    categorias = ["Alta", "Media", "Baja"]
    cantidades = [alta, media, baja]

    grafico.bar(
        categorias,
        cantidades,
        color=["#EF4444", "#F59E0B", "#22C55E"]
    )

    grafico.set_title("Distribucion de prioridades")
    grafico.set_ylabel("Cantidad de predicciones")
    grafico.set_ylim(bottom=0)
    figura.tight_layout()

    # Mostrar grafico en Tkinter
    lienzo = FigureCanvasTkAgg(
        figura,
        master=ventana_estadisticas
    )

    lienzo.draw()
    lienzo.get_tk_widget().pack(pady=15)

# Botón principal de predicción
boton = tk.Button(
    contenido_principal,
    text="⚡  PREDECIR PRIORIDAD",
    font=("Segoe UI", 12, "bold"),
    bg="#0284C7",
    fg="#FFFFFF",
    activebackground="#0369A1",
    activeforeground="#FFFFFF",
    relief="flat",
    cursor="hand2",
    padx=30,
    pady=14,
    command=predecir
)
boton.pack(pady=(15, 8))

# Botón para limpiar los campos
boton_limpiar = tk.Button(
    contenido_principal,
    text="↻  LIMPIAR CAMPOS",
    command=limpiar,
    font=("Segoe UI", 10, "bold"),
    bg="#334155",
    fg="#F8FAFC",
    activebackground="#475569",
    activeforeground="#FFFFFF",
    relief="flat",
    cursor="hand2",
    width=25,
    pady=10
)

boton_limpiar.pack(pady=5)

# Botón para consultar el historial
boton_historial = tk.Button(
    contenido_principal,
    text="📋  VER HISTORIAL",
    font=("Segoe UI", 10, "bold"),
    bg="#1D4ED8",
    fg="#FFFFFF",
    activebackground="#1E40AF",
    activeforeground="#FFFFFF",
    relief="flat",
    cursor="hand2",
    width=25,
    pady=11,
    command=mostrar_historial
)

boton_historial.pack(pady=6)

# Botón para consultar estadísticas
boton_estadisticas = tk.Button(
    contenido_principal,
    text="📊  VER ESTADÍSTICAS",
    font=("Segoe UI", 10, "bold"),
    bg="#0F766E",
    fg="#FFFFFF",
    activebackground="#115E59",
    activeforeground="#FFFFFF",
    relief="flat",
    cursor="hand2",
    width=25,
    pady=11,
    command=mostrar_estadisticas
)

boton_estadisticas.pack(pady=6)


# Pie de página
tk.Label(
    contenido_principal,
    text="ESMERALDAS RESILIENTE  |  IA Y ANALÍTICA",
    font=("Segoe UI", 9, "bold"),
    bg="#0F172A",
    fg="#64748B"
).pack(side="bottom", pady=12)

# Aviso sobre el uso del sistema
tk.Label(
    contenido_principal,
    text="PROTOTIPO ACADÉMICO  |  DATOS FICTICIOS",
    font=("Segoe UI", 9, "bold"),
    bg="#0F172A",
    fg="#FBBF24"
).pack(pady=(12, 3))

tk.Label(
    contenido_principal,
    text="Las predicciones son estimaciones y no sustituyen\n"
         "la evaluación de las autoridades competentes.",
    font=("Segoe UI", 8),
    bg="#0F172A",
    fg="#94A3B8",
    justify="center"
).pack(pady=3)
# Iniciar aplicación
ventana.mainloop()
