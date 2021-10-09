import './App.css';
import ICSDropZone from './ICSDropZone';
import { useState } from 'react';
import { VEvent, ICalParser } from 'cozy-ical';
import deleteIcon from './images/delete.png';
import icalIcon from './images/ical.png';

function splitCalendar(calendar, parts) {
  const nonEventComponents = calendar.subComponents.filter(comp => !(comp instanceof VEvent))
  const eventComponents = calendar.subComponents.filter(comp => comp instanceof VEvent)
  const calendars = [];
  const eventsPerPart = Math.ceil(eventComponents.length / parts);
  for (let part = 0; part < parts; part++) {
    const partComponents = nonEventComponents.concat(
      eventComponents.slice(part * eventsPerPart, (part + 1) * eventsPerPart));
    calendars.push(Object.assign(
      Object.create(Object.getPrototypeOf(calendar)), 
      calendar, 
      { subComponents: partComponents }
    ));
  }
  return calendars;
}

function downloadBlobs(contents) {
  console.log(Object.entries(contents));
  Object.entries(contents)
    .forEach(([filename, contents]) => downloadBlob(filename, contents));
}

function downloadBlob(filename, content) {
  console.log(`Forcing download of ${filename}`)
  const url = URL.createObjectURL(new Blob([content]));
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.style = "display: none"
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function downloadInParts(calendar, parts) {
  downloadBlobs(
    Object.fromEntries(splitCalendar(calendar, parts).map(
      (subCalendar, index) => [`part${index}.ics`, subCalendar.toString()]
    ))
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [calendar, setCalendar] = useState(null);
  const [parts, setParts] = useState(2)

  return (
    <div className="App">
      <header className="App-header">
        <h1>ICS file splitter</h1>
      </header>

      <p>This page splits your ICS file in the browser, no calendar data is sent anywhere.</p>

      {
        file
          ? <div class="file">
              <img class="icon" src={icalIcon} alt="ICS icon"/>
              {file.name || "unknown filename"}
              <img class="discard" 
                   src={deleteIcon}
                   alt="Discard file"
                   onClick={e => { setFile(null); setCalendar(null) }}/>
            </div>
          : <ICSDropZone onDrop={acceptedFiles => {
            const acceptedFile = acceptedFiles[0];
            setFile(acceptedFile)
            if (acceptedFile) {
              const reader = new FileReader();
              reader.onload = e => {
                const parser = new ICalParser();
                parser.parseString(reader.result, (error, parsedCal) => {
                  setCalendar(parsedCal);
                });
              };
              reader.readAsText(acceptedFiles[0]);
            }
          }} />
      }

      {
        (file && !calendar)
          ? <p>Loading {file.path}...</p>
          : calendar ? <ul>
            <li>Size: {calendar.toString().length} bytes</li>
            <li>Events: {calendar.subComponents.filter(comp => comp instanceof VEvent).length}</li>
          </ul>
            : <p>No file</p>
      }

      {
        (file && calendar)
          ? <div>
            <p>
              Split in
              <input class="parts" type="number" onChange={event => setParts(Math.max(parseInt(event.target.value) || 0, 2))} value={parts} />
              parts
            </p>
            <p><input type="button" value="Download" onClick={e => downloadInParts(calendar, parts)}/></p>
          </div>
          : null
      }
      <footer>
        Done with ❤️ by <a href="https://sortega.github.io/about/">sortega</a> from 🇪🇸
      </footer>
    </div>
  );
}

export default App;
