
import tkinter as tk
from tkinter import ttk, messagebox
import pandas as pd
import joblib

# =====================================
# MODULO 6 - IA & DATOS
# SISTEMA DE PREDICCION DE INCIDENTES
# =====================================

# Cargar el modelo entrenado
modelo = joblib.load("modelos/modelo_prioridad.pkl")

# Crear ventana principal
ventana = tk.Tk()
ventana.title("Sistema de prediccion de incidentes")
ventana.geometry("550x450")
ventana.resizable(False, False)

# Titulo
titulo = tk.Label(
    ventana,
    text="SISTEMA DE PREDICCION DE INCIDENTES",
    font=("Arial", 15, "bold")
)
titulo.pack(pady=20)

subtitulo = tk.Label(
    ventana,
    text="Modelo de Machine Learning",
    font=("Arial", 11)
)
subtitulo.pack()

# Seleccion de zona
tk.Label(
    ventana,
    text="Seleccione la zona:",
    font=("Arial", 11)
).pack(pady=(25, 5))

zonas = [
    "Esmeraldas Centro",
    "Las Palmas",
    "Tachina",
    "Atacames",
    "Rioverde"
]

zona_seleccionada = ttk.Combobox(
    ventana,
    values=zonas,
    state="readonly",
    width=35
)
zona_seleccionada.pack()
zona_seleccionada.set("Esmeraldas Centro")

# Seleccion del tipo de incidente
tk.Label(
    ventana,
    text="Seleccione el tipo de incidente:",
    font=("Arial", 11)
).pack(pady=(20, 5))

tipos = [
    "Inundacion",
    "Deslizamiento",
    "Incendio"
]

tipo_seleccionado = ttk.Combobox(
    ventana,
    values=tipos,
    state="readonly",
    width=35
)
tipo_seleccionado.pack()
tipo_seleccionado.set("Inundacion")

# Funcion para realizar la prediccion
def predecir():
    nuevo_incidente = pd.DataFrame({
        "zona": [zona_seleccionada.get()],
        "tipo_incidente": [tipo_seleccionado.get()]
    })

    resultado = modelo.predict(nuevo_incidente)

    etiqueta_resultado.config(
        text=f"Prioridad estimada: {resultado[0]}"
    )

# Boton de prediccion
boton = tk.Button(
    ventana,
    text="PREDECIR PRIORIDAD",
    font=("Arial", 11, "bold"),
    command=predecir,
    padx=15,
    pady=8
)
boton.pack(pady=30)

# Resultado
etiqueta_resultado = tk.Label(
    ventana,
    text="Esperando prediccion...",
    font=("Arial", 13, "bold")
)
etiqueta_resultado.pack(pady=10)

# Iniciar aplicacion
ventana.mainloop()
