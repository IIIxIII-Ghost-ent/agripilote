export default function ZoneList({ zones, onDelete }) {
  if (zones.length === 0) {
    return <p>Aucune zone</p>
  }

  return zones.map(z => (
    <div key={z.id} style={{ border: '1px solid #ccc', marginTop: 10 }}>
      <strong>{z.nom}</strong>
      <p>{z.surface} ha</p>
      <button onClick={() => onDelete(z.id)}>Supprimer</button>
    </div>
  ))
}
