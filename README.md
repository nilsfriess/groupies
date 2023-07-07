# `Groupies` - Verwalte Anmeldungen zu Workshops, Führungen etc.

Die Webversion von `Groupies` ist [hier](https://groupie-workshop.web.app/) verfügbar.

Um eine eigene Version zu hosten wird ein [Firebase](https://firebase.google.com/)-Account und [Firebase CLI](https://firebase.google.com/docs/cli) benötigt. Nachdem Firebase CLI installiert ist, klone `Groupies` und wechsle in den erstellten Ordner.
```terminal
$ git clone https://github.com/nilsfriess/groupies
$ cd groupies
```
Richte anschließend Firebase ein
```terminal
$ firebase login
...
$ firebase init hosting
```
Nachdem alles eingerichtet wurde, kann die Webseite mit
```
$ npm run build
$ firebase deploy
```
veröffentlich werden.

Im der [Firebase Console](https://console.firebase.google.com/) sollten für die Datenbank noch Sicherheitsregeln hinzugefügt werden, bspw.
```json
{
  "rules": {
    "questionnaires": {
      "$user_id": {
           ".read": "$user_id === auth.uid",
           ".write": "$user_id === auth.uid",
           "$qid": {
            	".read": true
           }         
      }
    },
    "answers": {
       "$user_id": {
         "$qid": {
          ".read": "$user_id === auth.uid || root.child('questionnaires/' + $user_id + '/' + $qid).child('orgas').child('0').val() === auth.token.email || root.child('questionnaires/' + $user_id + '/' + $qid).child('orgas').child('1').val() === auth.token.email || root.child('questionnaires/' + $user_id + '/' + $qid).child('orgas').child('2').val() === auth.token.email || root.child('questionnaires/' + $user_id + '/' + $qid).child('orgas').child('3').val() === auth.token.email",
          ".write": true
         }
      }
   },
     "sharedQuestionnaires": {
       "$user_email": {
         ".read": "$user_email === auth.token.email.replace('.', ',')",
         "$org_id": {
          ".read": "$user_email === auth.token.email.replace('.', ',') || auth.uid === $org_id",
          ".write": "auth.uid !== null"
       }
       }
     }
  }
}	
```
