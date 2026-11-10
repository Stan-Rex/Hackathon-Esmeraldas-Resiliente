
import pandas as pd
import matplotlib.pyplot as plt

# =====================================
# MODULO 6 - IA & DATOS
# ANALISIS DE INCIDENTES
# =====================================

print("====================================")
print("     ANALISIS DE INCIDENTES")
print("====================================")

# 1. Cargar los datos
datos = pd.read_csv("datos/incidentes.csv")

# 2. Mostrar los registros
print("\nREGISTROS DE INCIDENTES:")
print(datos.to_string(index=False))

# 3. Total de incidentes
print("\nTOTAL DE INCIDENTES:")
print(len(datos))

# 4. Incidentes por tipo
print("\nINCIDENTES POR TIPO:")
print(datos["tipo_incidente"].value_counts())

# 5. Incidentes por zona
print("\nINCIDENTES POR ZONA:")
print(datos["zona"].value_counts())

# 6. Incidentes por prioridad
print("\nINCIDENTES POR PRIORIDAD:")
print(datos["nivel_prioridad"].value_counts())

# =====================================
# GRAFICO 1: INCIDENTES POR TIPO
# =====================================

incidentes_tipo = datos["tipo_incidente"].value_counts()

plt.figure(figsize=(8, 5))
incidentes_tipo.plot(kind="bar")

plt.title("Cantidad de incidentes por tipo")
plt.xlabel("Tipo de incidente")
plt.ylabel("Cantidad")
plt.xticks(rotation=0)
plt.tight_layout()

plt.show()

# =====================================
# GRAFICO 2: INCIDENTES POR ZONA
# =====================================

incidentes_zona = datos["zona"].value_counts()

plt.figure(figsize=(8, 5))
incidentes_zona.plot(kind="bar")

plt.title("Cantidad de incidentes por zona")
plt.xlabel("Zona")
plt.ylabel("Cantidad")
plt.xticks(rotation=30)
plt.tight_layout()

plt.show()

print("\nANALISIS FINALIZADO")
# =====================================
# ETAPA 2: CALIDAD DE LOS DATOS
# =====================================

print("\n====================================")
print("       CALIDAD DE LOS DATOS")
print("====================================")

# 1. Revisar datos vacios
print("\nDATOS VACIOS POR COLUMNA:")
print(datos.isnull().sum())

# 2. Revisar registros duplicados
print("\nREGISTROS DUPLICADOS:")
print(datos.duplicated().sum())

# 3. Revisar tipos de datos
print("\nTIPOS DE DATOS:")
print(datos.dtypes)

# 4. Mostrar dimensiones del conjunto de datos
print("\nDIMENSIONES DEL CONJUNTO DE DATOS:")
print("Filas:", datos.shape[0])
print("Columnas:", datos.shape[1])