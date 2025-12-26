import pandas as pd

df = pd.read_excel(r'C:\Users\isakd\Desktop\AlleSøkere_SENDTILAI.xlsx')

print('=== ANALYSE AV EXCEL-DATA ===')
print(f'Totalt: {len(df)} sokere')
print()

# Status
print('Status fordeling:')
print(df['Status'].value_counts().to_string())
print()

# Hvor mange har data
epost_count = df['E-post'].notna().sum()
telefon_count = df['Telefon'].notna().sum()
erfaring_count = df['Erfaring'].notna().sum()
cv_count = df['CV URL'].notna().sum()

print(f'Med e-post: {epost_count}')
print(f'Med telefon: {telefon_count}')
print(f'Med erfaring: {erfaring_count}')
print(f'Med CV URL: {cv_count}')
print()

# Vis noen eksempler med erfaring
print('=== EKSEMPLER MED ERFARING ===')
with_exp = df[df['Erfaring'].notna()].head(5)
for _, row in with_exp.iterrows():
    print(f"Navn: {row['Navn']}")
    print(f"E-post: {row['E-post']}")
    erfaring = str(row['Erfaring'])[:150] + '...' if len(str(row['Erfaring'])) > 150 else row['Erfaring']
    print(f"Erfaring: {erfaring}")
    print()

