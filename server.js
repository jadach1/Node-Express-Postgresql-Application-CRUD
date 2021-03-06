var     express = require('express'),
	path = require('path'),
	bodyParser = require('body-parser'),
	cons = require('consolidate'),
	dust = require('dustjs-helpers'),
 	 { Pool } = require('pg')
        app = express();

var connect = "postgres://jacob:$password@localhost/postgres";

const pool = new Pool({
  connectionString: connect,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

// assign dust engine to .dust files
 app.engine('dust',cons.dust);

// set default ext .dust
 app.set('view engine','dust');
 app.set('views',__dirname + '/views');

// set public folder
 app.use(express.static(path.join(__dirname, 'public')));

// body parser middleware
 app.use(bodyParser.json());
 app.use(bodyParser.urlencoded({ extended : false }));

app.get('/',function(req,res){
    // promise - checkout a client
    pool.connect()
        .then(client => {
            return client.query('SELECT * FROM PERSON')
            .then(result => {
	        client.release()
		res.render('index', {people: result.rows});
                console.log(result.rows[0])
            })
        .catch(e => {
            client.release()
            console.log(err.stack)
        })
    })
});

app.post('/add', function(req, res){
    // callback - checkout a client
    pool.connect((err, client, done) => {
	if (err) throw err
        client.query("insert into person(name,age) values($1, $2)",
        [req.body.name,req.body.age], (err, result) => {
        done()

        if (err) {
                console.log(err.stack)
        } else {
                console.log(result.rows[0])
                res.redirect('/')
        }
        })
    })
});

app.delete('/delete/:id', function(req, res){
	// async/await - check out a client
	(async () => {
		const client = await pool.connect()
		try {
			const result = await client.query('DELETE FROM PERSON WHERE id = $1', [req.params.id])
			console.log(result.rows[0])
			res.sendStatus(200)
		} finally {
			client.release()
		}
	})().catch(e => console.log(e.stack))
});

app.post('/edit', function(req, res){
    // callback - checkout a client
    pool.connect((err, client, done) => {
        if (err) throw err
        client.query('UPDATE PERSON SET name=$1, age=$2 WHERE id=$3',
        [req.body.name, req.body.age , req.body.id], (err, result) => {
        done()

        if (err) {
                console.log(err.stack)
        } else {
                console.log(result.rows[0])
                res.redirect('/')
        }
        })
    })
});


// server
app.listen(3000, function(){
		console.log('Server Started On Port 3000');
});
