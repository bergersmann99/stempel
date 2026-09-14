/* Konfiguration.
   Die Client-ID ist kein Geheimnis. Sie steht in jeder Browser-App offen im
   Quelltext, und das ist bei Google so vorgesehen. Der Schutz kommt nicht
   daher, dass die ID geheim bliebe, sondern aus zwei anderen Sperren:

   1. In der Google Cloud Console hinterlegst du deine Pages-Adresse als einzigen
      erlaubten JavaScript-Ursprung. Mit der ID von einer anderen Seite aus
      bekommt niemand ein Token.
   2. Die App fragt ausschliesslich den Bereich drive.file an. Damit sieht sie
      nur Dateien, die sie selbst angelegt hat. Der Rest deines Drive bleibt
      fuer sie unsichtbar, auch wenn du es erlauben wolltest.

   Ein Client Secret gehoert hier NICHT hinein. Browser-Apps brauchen keins,
   und ein hinterlegtes Secret waere ein echtes Leck. */

window.STEMPEL_CONFIG = {
  // Aus der Google Cloud Console, endet auf .apps.googleusercontent.com
  googleClientId: '',

  // Name der Tabelle, die die App in deinem Drive anlegt
  dateiName: 'Arbeitszeiten'
};
