# lazer-to-classic Export Tool
![CodeRabbit Pull Request Reviews](https://img.shields.io/coderabbit/prs/github/Blazzycrafter/OsuLazerMapsToClassic?utm_source=oss&utm_medium=github&utm_campaign=Blazzycrafter%2FOsuLazerMapsToClassic&labelColor=171717&color=FF570A&link=https%3A%2F%2Fcoderabbit.ai&label=CodeRabbit+Reviews)![GitHub last commit](https://img.shields.io/github/last-commit/Blazzycrafter/OsuLazerMapsToClassic)


Ein CLI-Tool zum Exportieren von Beatmap-Sets aus **osu!lazer** in das klassische `.osz`-Format, kompatibel mit dem alten osu!-Client.

## 📦 Features

- 🔍 **Fuzzy-Suche** mit Live-Vorschau über Künstler- und Titelnamen  
- ✅ **Mehrfachauswahl** dank `inquirer-checkbox-plus-prompt`  
- 🔢 **Export kompletter oder selektiver Sets**  
- 📂 **Pfad-Parsing für osu!lazer über %APPDATA%\osu**  
- 🔒 **Realm-Datenbank wird readonly geladen**  
- 🧹 **Temporäre Ordner werden nach dem Export entfernt**  
- 📦 **Flache ZIP-Struktur** im `.osz`-Format  
- 💬 **Saubere Konsolenausgabe** mit Fortschrittsanzeige via `cli-progress`  
- 💡 **Pfad-Sanitisierung** zur Vermeidung ungültiger Zeichen  
- 🚫 **Keine Duplikate** im Export (mehrere `-1` Sets werden korrekt behandelt)  

## 🧪 Voraussetzungen

- **Node.js** Version 18 oder höher  
- Folgende NPM-Module:
  - `inquirer`
  - `inquirer-autocomplete-prompt`
  - `inquirer-checkbox-plus-prompt@1.3.0`
  - `realm`
  - `fuse.js`
  - `tmp-promise`
  - `archiver`
  - `cli-progress`

Installation:
```bash
npm install
```

## ▶️ Verwendung

```bash
node main.js
```

- Beim Start fragt das Tool nach dem Pfad zum osu!-Verzeichnis.
- Danach wird die Realm-Datenbank gelesen und die Anzahl verfügbarer Beatmap-Sets angezeigt.
- Du kannst entscheiden, ob **alle** Sets exportiert oder gezielt einzelne via **Fuzzy-Suche** ausgewählt werden sollen.
- Die exportierten `.osz`-Dateien findest du im Unterordner `exports` im osu!-Verzeichnis.

## 📁 Beispielstruktur nach Export

```
exports/
├── 1011011 nekodex - new beginnings.osz
├── 1032103 LukHash - H8 U.osz
└── ...
```

## ❗ Hinweise

- Set-IDs wie `-1` (nicht hochgeladen) werden trotzdem eindeutig verarbeitet.
- Ungültige Zeichen in Dateinamen (z. B. `:`) werden automatisch ersetzt.
- Die `.osz`-Dateien enthalten die Beatmap-Dateien direkt ohne zusätzlichen Unterordner – kompatibel mit dem osu!-Classic-Importer.

## 🛠️ Credits

- Tool entwickelt für den persönlichen Export aus osu!lazer.
- Basierend auf offiziellen osu!lazer-Dateistrukturen (Realm + `files/`-Ordner).
