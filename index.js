import express, { request, response } from "express";
import dotenv from "dotenv";
import {MongoClient} from "mongodb";
import fs from "fs";


dotenv.config();
const app = express();
const PORT = process.env.PORT;
app.use(express.json());

const MONGO_URL=process.env.MONGO_URL;

async function createConnection(){
     const client = new MongoClient(MONGO_URL);
     await client.connect();
    console.log("Connected To Database😉👍");
    return client;  
}

const client = await createConnection();


// Method to display all the endpoints available.
app.get("/", (request, response) => {
    fs.readFile('index.html', 'utf-8', (err,data)=>{
        err? res.send(err) : response.send(data)
      })
})

//Method to display all the students available.
app.get("/students", async (request, response) => {
   const result = await client.db("assign-mentor").collection("students").find({}).toArray();
    response.send(result)
})

//Method to display all the mentors available.
app.get('/mentors',async(request,response) =>{
    const result = await client.db("assign-mentor").
       collection("mentors").
       find({})
       .toArray();
       console.log(result);
       response.send(result);
})

// Method to add a new student to the students collection
app.post('/create-student',async(request,response)=>{
    const data = request.body
    console.log(data);
    const result = await client.db("assign-mentor").
    collection("students")
    .insertOne(data)
})


// Method to add a new mentor to the mentors collection
app.post("/create-mentor", async (request, response) => {
    const data = request.body
    const result = await client.db("assign-mentor").collection("mentors").insertOne(data)
    response.send(result)
})

// Method to assign students to the given mentor.
app.put("/assign-student-to-mentor/:id", async (request, response) => {
    const { id } = request.params
    const data = request.body
    const mentor = await client.db("assign-mentor").collection("mentors").findOne({ mentor_id: id })
    let students_under_mentor = mentor.students
    console.log(students_under_mentor);
    const all_students = await client.db("assign-mentor").collection("students").find({}).toArray()
    console.log(all_students);
    all_students.forEach(async (x) => {

        if (students_under_mentor.includes(+x.student_id) && !x.mentor) {
            await client.db("assign-mentor").collection("mentors").updateOne({ mentor_id: id }, { $set: data })
            await client.db("assign-mentor").collection("students").updateOne({ student_id: x.student_id }, { $set: { "mentor": id } })
            console.log(x.name, "is assigned to", mentor.name)
        } else if (students_under_mentor.includes(+x.student_id) && !!x.mentor) {
            console.log(x.name, "is already assigned to mentor")
        }
    })
    response.send(mentor)
})


// Method to Update or Assign mentor to the given student.
app.put("/assign-mentor-to-student/:id", async (request, response) => {
    const { id } = request.params
    const data = request.body
    const result = await client.db("assign-mentor").collection("students").updateOne({ student_id: id }, { $set: data })
    console.log(result)
    const student = await client.db("assign-mentor").collection("students").findOne({ student_id: id })
    console.log(student)
    response.send(student.name + " is assigned to given mentor")
})
 
// Displays all the students under the given mentor
app.get("/all-students-under-mentor/:id", async (request, response) => {
    const { id } = request.params
    const mentor = await client.db("assign-mentor").collection("mentors").findOne({ mentor_id: id });
    const all_students = await client.db("assign-mentor").collection("students").find({}).toArray();
    let students_under_mentor =   mentor.students;
    let result = []
    all_students.forEach((x) => {
        if (students_under_mentor.includes(+x.student_id)) {
            result.push(x.name)
        }
    })
    response.send(result)
})


app.listen(PORT, () => console.log("App started in ", PORT));