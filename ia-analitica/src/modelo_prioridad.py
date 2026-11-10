import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import accuracy_score
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay
import matplotlib.pyplot as plt
# =====================================
# MODULO 6 - IA & DATOS
# PRIMER MODELO DE MACHINE LEARNING
# =====================================

print("====================================")
print("     MODELO DE INTELIGENCIA ARTIFICIAL")
print("====================================")

# 1. Cargar los datos
datos = pd.read_csv("datos/incidentes.csv")

# 2. Seleccionar las características
X = datos[["zona", "tipo_incidente"]]

# 3. Seleccionar lo que queremos predecir
y = datos["nivel_prioridad"]

# 4. Mostrar las características
print("\nCARACTERISTICAS DE ENTRADA:")
print(X)

# 5. Mostrar los resultados esperados
print("\nPRIORIDADES QUE APRENDERA EL MODELO:")
print(y)

print("\nDATOS PREPARADOS CORRECTAMENTE")

# =====================================
# 6. PREPARAR LOS DATOS PARA MACHINE LEARNING
# =====================================

# Separar los datos en entrenamiento y prueba
X_entrenamiento, X_prueba, y_entrenamiento, y_prueba = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y
)

# Convertir los textos en valores numericos
preprocesamiento = ColumnTransformer(
    transformers=[
        ("categorias", OneHotEncoder(handle_unknown="ignore"), ["zona", "tipo_incidente"])
    ]
)

# Crear el modelo de aprendizaje
modelo = Pipeline(steps=[
    ("preparacion", preprocesamiento),
    ("clasificador", DecisionTreeClassifier(random_state=42))
])

# Entrenar el modelo
modelo.fit(X_entrenamiento, y_entrenamiento)
# Guardar el modelo entrenado
joblib.dump(modelo, "modelos/modelo_prioridad.pkl")

print("\nMODELO GUARDADO CORRECTAMENTE")

print("\n====================================")
print("MODELO ENTRENADO CORRECTAMENTE")
print("====================================")

print("Registros para entrenamiento:", len(X_entrenamiento))
print("Registros para pruebas:", len(X_prueba))

# =====================================
# 7. PRIMERA PREDICCION
# =====================================

# Crear un nuevo incidente
nuevo_incidente = pd.DataFrame({
    "zona": ["Esmeraldas Centro"],
    "tipo_incidente": ["Inundacion"]
})

# Solicitar una prediccion al modelo
prediccion = modelo.predict(nuevo_incidente)

print("\n====================================")
print("       PRIMERA PREDICCION")
print("====================================")

print("Zona:", nuevo_incidente.iloc[0]["zona"])
print("Tipo:", nuevo_incidente.iloc[0]["tipo_incidente"])
print("Prioridad predicha:", prediccion[0])

# =====================================
# 8. EVALUACION DEL MODELO
# =====================================

# Realizar predicciones con los datos de prueba
predicciones = modelo.predict(X_prueba)

# Comparar las predicciones con las respuestas reales
precision = accuracy_score(y_prueba, predicciones)

print("\n====================================")
print("       EVALUACION DEL MODELO")
print("====================================")

print("Respuestas reales:")
print(y_prueba.tolist())

print("\nPredicciones del modelo:")
print(predicciones.tolist())

print("\nPrecision del modelo:")
print(f"{precision * 100:.2f}%")

# =====================================
# 9. MATRIZ DE CONFUSION
# =====================================

# Comparar las respuestas reales con las predicciones
matriz = confusion_matrix(
    y_prueba,
    predicciones,
    labels=["Alta", "Media", "Baja"]
)

print("\n====================================")
print("       MATRIZ DE CONFUSION")
print("====================================")

print(matriz)

# Crear grafico de la matriz
grafico = ConfusionMatrixDisplay(
    confusion_matrix=matriz,
    display_labels=["Alta", "Media", "Baja"]
)

grafico.plot(cmap="Blues")

plt.title("Matriz de confusion del modelo")
plt.tight_layout()
plt.show()