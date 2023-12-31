import express from "express";
import bodyParser from "body-parser";
import pg from "pg";

const app = express();
const port = 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

const db = new pg.Client({
  user: "postgres",
  host: "localhost",
  database: "world",
});

let users; 

db.connect();

db.query("select * from users", (err, res) => {
  if(err)
    console.log('error has occured');
  else
  {
    users = res.rows;
  }
})

let currentUserId = 1;

async function checkVisisted()
{
  const result = await db.query("select user_id, country_code from users JOIN visited_countries_u1 ON user_id = users.id where user_id = $1",[currentUserId]);
  let countries = [];
  result.rows.forEach((country) => 
  {
    countries.push(country.country_code);
  });
  return countries;
}

app.get("/", async (req, res) => 
{
  const countries = await checkVisisted();
  res.render("index.ejs", {
    countries: countries,
    total: countries.length,
    users: users,
    color: "teal",
    curr_color: users[currentUserId-1].color
  });
});

app.post("/add", async (req, res) => 
{
  const input = req.body["country"];

  try 
  {
    const result = await db.query(
      "SELECT country_code FROM country_data WHERE LOWER(country_name) LIKE '%' || $1 || '%';",[input.toLowerCase()]
    );
    const data = result.rows[0];
    const countryCode = data.country_code;
    
    try {
      await db.query
      (
        "INSERT INTO visited_countries_u1 (country_code,user_id) VALUES ($1,$2)",
        [countryCode, currentUserId]
      );

      res.redirect("/");
    } 
    catch (err) {
      console.log(err.detail);
    }
  } 
  
  catch (err) {
    console.log(err);
  }
});

app.post("/user", (req, res) => {
    
    const received_data = req.body;
    if(received_data.add)
    {
      res.render("new.ejs");
    }

    else if(received_data.user)
    {
      currentUserId = received_data.user;
      res.redirect("/");
    }
  
});
app.post("/new", async (req, res) => 
{

  let res_new = await db.query("insert into users(name, color) values ($1,$2) RETURNING id, name, color",[req.body.name,req.body.color]);
  users.push(res_new.rows[0]);
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
