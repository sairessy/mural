// import path from 'path';
// import { fileURLToPath } from 'url';
// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// Import the functions you need from the SDKs you need
// import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCuCBP3m0B7ANA55MWiXYDOxLSKnNL0uks",
  authDomain: "mural-44a8b.firebaseapp.com",
  projectId: "mural-44a8b",
  storageBucket: "mural-44a8b.appspot.com",
  messagingSenderId: "1099001930347",
  appId: "1:1099001930347:web:9830216afee6de7046472e"
};

// Initialize Firebase
// const firebase = initializeApp(firebaseConfig);

const Datastore = require('nedb');
const cookieParser = require('cookie-parser');
const db = {
    users: new Datastore('./src/database/users.db'),
    vitrolas: new Datastore('./src/database/vitrolas.db'),
    documents: new Datastore('./src/database/documents.db')
};

db.users.loadDatabase();
db.vitrolas.loadDatabase();
db.documents.loadDatabase();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({limit: '1mb'}));
app.use(cookieParser());
app.use(express.static('public'));
app.listen(PORT, () => console.log('PORT: ' + PORT));

app.get('/login', (req, res) => {
    if (req.cookies.user !== undefined) {
        res.sendFile(__dirname + '/public/dashboard.html')
    } else {
        res.sendFile(__dirname + '/public/login.html');
    }    
});

app.get('/download/:id', (req, res) => {
    res.sendFile(__dirname + '/public/download.html');
});

app.get('/signup', (req, res) => {
    if (req.cookies.user !== undefined) {
        res.sendFile(__dirname + '/public/dashboard.html')
    } else {
        res.sendFile(__dirname + '/public/signup.html');
    }
});

app.get('/dashboard', (req, res) => {

    if (req.cookies.user !== undefined) {
        res.sendFile(__dirname + '/public/dashboard.html')
    } else {
        res.sendFile(__dirname + '/public/login.html');
    }
});

app.post('/addvitrola', (req, res) => {
    const data = req.body;
    db.vitrolas.insert({...data, docs: [], time: Date.now().toString(), 
        user: req.cookies.user, removed: false}, (err, doc) => console.log(doc));
    res.json({success: true});
});

app.post('/adddoc', (req, res) => {
    const data = req.body;

    // db.vitrolas.update({ _id: data.vitrolaId }, {
    //     $set: {
    //         docs: [{...data, time: Date.now().toString()}]
    //     }
    // }, { multi: true }, function (err, numReplaced) {
    //     // console.log(numReplaced)
    // });
    const time = Date.now().toString();
    const newDoc = {
        ...data, time, removed: false
    }

    db.vitrolas.update({ _id: data.vitrolaId }, { $push: { docs: newDoc } }, {}, function () {
        // Now the fruits array is ['apple', 'orange', 'pear', 'banana']
    });

    db.documents.insert({doc: time, base64: data.file.base64 });

    res.json({})
});

app.get('/vitrolas', async (req, res) => {
    db.vitrolas.find({removed: false}, async (err, data) => {
        let  d = data;

        for (let i = 0; i < data.length; i++) {
            const v = data[i];
            v.userOffice = await new Promise((resolve, reject) => {
                db.users.findOne({_id: v.user}, (err, dt) => {
                    resolve(dt.office);
                });
            }); 
        }

        res.json(data);
    });
});

app.get('/vitrola/:id', async (req, res) => {
    const id = req.params.id;

    db.vitrolas.findOne({removed: false, _id: id}, async (err, data) => {
        if(data != null) {
            let  d = data;

            d.userOffice = await new Promise((resolve, reject) => {
                db.users.findOne({_id: d.user}, (err, dt) => {
                    resolve(dt.office);
                });
            }); 
            console.log(d)
            res.json(data);
        } else {
            res.json({})
        }
    });
});

app.get('/uservitrolas', (req, res) => {
    db.vitrolas.find({user: req.cookies.user, removed: false}, (err, data) => {
        console.log(data)
        res.json(data);
    });
});

app.post('/removedoc', (req, res) => {
    const data = req.body;

    db.vitrolas.findOne({ _id: data.vitrolaId }, (err, d) => {
        let ds = d.docs;
        
        for (let i = 0; i < d.docs.length; i++) {
            const e = d.docs[i];
            if(e.time == data.doc) {
                ds[i].removed = true;
                break;
            }
        }
        
        db.vitrolas.update({ _id: data.vitrolaId }, {
            $set: {
                docs: ds
            }
        }, { multi: true }, function (err, numReplaced) {
            // console.log(numReplaced)
        });
    });
  
    res.json({})
});

app.post('/removevitrola', (req, res) => {
    const data = req.body;
    console.log(req.body);
    db.vitrolas.update({ _id: data.vitrolaId }, {
        $set: {
            removed: true
        }
    }, { multi: true }, function (err, numReplaced) {
        // console.log(numReplaced)
    });
    res.json({})
});

app.get('/logout', (req, res) => {
    res.clearCookie('user', {})
    res.redirect('/login')
});

app.post('/login', (req, res) => {
    const data = req.body;
    db.users.findOne({email: data.email, pass: data.pass}, (err, d) => {
        
        if(d != null) {
            res.cookie('user', d._id, {});
        }

        res.json({success: d != null});
    });
});

app.post('/signup', (req, res) => {
    const data = req.body;
    db.users.insert(data, (err, doc) => console.log(doc));
    res.json({});
});

app.get('/doc/:id', (req, res) => {
    const id = req.params.id;
    db.documents.findOne({doc: id}, (err, data) => {
        res.json({data});
    });
});

app.get('/search/:text', (req, res) => {
    const text = req.params.text;

   res.json({});
});