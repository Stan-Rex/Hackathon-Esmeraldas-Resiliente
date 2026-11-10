import pandas as pd
import joblib

# =====================================
# MODULO 6 - IA & DATOS
# PREDICCIONES CON MODELO GUARDADO
# =====================================

print("====================================")
print("     SISTEMA DE PREDICCION")
print("====================================")

# 1. Cargar el modelo entrenado
modelo = joblib.load("modelos/modelo_prioridad.pkl")

print("\nModelo cargado correctamente")

# 2. Crear un nuevo incidente
nuevo_incidente = pd.DataFrame({
    "zona": ["Las Palmas"],
    "tipo_incidente": ["Deslizamiento"]
})

# 3. Realizar la prediccion
prediccion = modelo.predict(nuevo_incidente)

# 4. Mostrar el resultado
print("\nDATOS DEL INCIDENTE:")
print(nuevo_incidente)

print("\nRESULTADO DE LA PREDICCION:")
print("Prioridad:", prediccion[0])

print("\nPROCESO FINALIZADO")