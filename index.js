const express = require('express');
const postgres = require('postgres');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((_, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

const port = 3000;

let PGHOST, PGDATABASE, PGUSER, PGPASSWORD, ENDPOINT_ID;

PGHOST = 'ep-shrill-resonance-a2b3sq0a.eu-central-1.aws.neon.tech'
PGDATABASE = 'educational_institution_DB'
PGUSER = 'parvane.pakzadan'
PGPASSWORD = '8cKn2EXoQlAS'
ENDPOINT_ID = 'ep-shrill-resonance-a2b3sq0a'

const sql = postgres({
    host: PGHOST,
    database: PGDATABASE,
    username: PGUSER,
    password: PGPASSWORD,
    port: 5432,
    ssl: 'require',
    connection: {
        options: `project=${ENDPOINT_ID}`,
    },
});

app.get('/login', async (request, response) => {
    try {
        const username = request.query.username;
        const password = request.query.password;
        if ((username != null) &&
            (username !== undefined) &&
            (password !== null) &&
            (password !== undefined)) {
            const result = await getUserByUsername(username);
            if (result && password === result.password) {
                response.send(result);
            } else {
                response.send({ message: "User does not exist or password does not match." }).status(400);
            }
        } else {
            response.send().status(404);
        }
    } catch (e) {
        response.status(500).send({ message: e.message })
    }
});

app.get('/users', async (request, response) => {
    try {
        const role = request.query.role;
        if (role) {
            getUsersByRole(role).then((result) => {
                response.send(result)
            });
        } else {
            getUsers().then((result) => {
                response.send(result)
            })
        }
    } catch (e) {
        response.status(500).send({ error: e.message });
    }
});

app.get('/users/:id', async (request, response) => {
    try {
        const userID = parseInt(request.params.id);
        if ((userID != null) && (userID !== undefined)) {
            const result = await getUser(userID);
            if (result) {
                response.send(result);
            }
        } else {
            response.send().status(404)
        }
    } catch (e) {
        response.status(500).send({ message: e.message })
    }
});

app.get('/users/:searchStr', (request, response) => {
    try {
        const searchItem = request.query.searchStr;
        if ((searchItem != null) && (searchItem !== undefined)) {
            getUserByFullNameRole(searchItem).then((result) => {
                response.send(result)
            });
        } else {
            response.send().status(404)
        }
    } catch (e) {
        response.status(500).send({ message: e.message })
    }
});

app.post('/users', (request, response) => {
    const user = request.body;
    console.log(user);
    if (user) {
        addUser(user)
    }
    response.send().status(204);
});

app.put('/users/:id', async (request, response) => {
    const userID = parseInt(request.params.id);
    const user = request.body;
    const updatedUser = await updateUser(userID, user);
    if (updatedUser) {
        response.send(updatedUser);
    } else {
        response.sendStatus(404);
    }
});

app.delete('/users/:id', (request, response) => {
    const userID = parseInt(request.params.id);
    //console.log("id:" + userID);
    if ((userID != null) && (userID !== undefined)) {
        //console.log("id: " + userID);
        deleteUser(userID).then((result) => {
            if (result) {
                console.log(result);
                response.send(result);
            }
        })
    }
});

async function getUsers() {
    try {
        let query = await sql`SELECT * FROM "user"`
        return query;
    } catch (e) {
        console.error(e);
    }
}

async function getUsersByRole(role) {
    try {
        let query = await sql`SELECT * FROM "user" WHERE role = ${role}`
        return query;
    } catch (e) {
        console.error(e);
    }
}

async function getUser(userID) {
    try {
        const result = await sql`SELECT * FROM "user" WHERE id = ${userID}`;
        return result[0];
    } catch (e) {
        // console.error(e);
        throw e;
    }
}

async function getUserByUsername(username) {
    try {
        const result = await sql`SELECT * FROM "user" U WHERE U.email = ${username}`;
        return result[0];
    } catch (e) {
        // console.error(e);
        throw e;
    }
}

async function getUserByFullNameRole(searchStr) {
    try {
        const result = await sql`SELECT * FROM "user" U WHERE TRIM(CONCAT(U.first_name, " ", U.last_name)) LIKE "%${searchStr}%" OR U.role LIKE "%${searchStr}%"`;
        return result[0];
    } catch (e) {
        // console.error(e);
        throw e;
    }
}

async function addUser(user) {
    try {
        const result = await sql`INSERT INTO user(email, password, first_name, last_name, phone, role) 
        values(${user.email}, ${user.password}, ${user.first_name}, ${user.last_name}, ${user.phone}, ${user.role})`
        return result;
    } catch (e) {
        console.error(e);
    }
}

async function updateUser(userID, user) {
    try {
        const result = await sql`UPDATE "user" SET
        email = ${user.email},
        first_name = ${user.first_name},
        last_name = ${user.last_name},
        phone = ${user.phone},
        role = ${user.role}
        WHERE id = ${userID}`;
        return result;
    } catch (e) {
        console.error(e);
    }
}

async function deleteUser(userID) {
    try {
        const result = await sql`DELETE FROM "user" WHERE id = ${userID}`;
        return result;
    } catch (e) {
        console.error(e);

    }
}

// Class
app.get('/classes', async (request, response) => {
    try {
        let result = [];
        const username = request.query.username;
        if (username !== null && username !== undefined) {
            result = await getClassessByUsername(username);
        } else {
            result = await getClasses();
        }
        if (result) {
            response.send(result);
        } else {
            response.send().status("Classes do not exist.");
        }
    } catch (e) {
        response.status(500).send({ message: e.message })
    }
});

app.get('/classes/:id', async (request, response) => {
    try {
        let user = null;
        let participantList = [];

        const classID = parseInt(request.params.id);
        if ((classID != null) && (classID !== undefined)) {
            const result = await getClassById(classID);
            const participants = await getParticipantsByClassId(classID);
            if (result) {
                if (result.organizer_id) {
                    user = await getUser(Number(result.organizer_id));
                }
    
                response.send({
                    id: result.id,
                    name: result.name,
                    type: result.type,
                    organizer: user,
                    participant: participants,
                });
            }
        } else {
            response.send().status(404)
        }
    } catch (e) {
        response.status(500).send({ message: e.message })
    }
});

app.put('/classes/:id', async (request, response) => {
    const classID = parseInt(request.params.id);
    const classDetails = request.body;
    const updatedClass = await updateClass(classID, classDetails);
    if (updatedClass) {
        response.send(updatedClass);
    } else {
        response.sendStatus(404);
    }
});

async function getClasses() {
    try {
        let result = await sql`SELECT * FROM "class"`
        return result
    } catch (e) {
        console.error(e)
    }
}

async function getClassById(classID) {
    try {
        const result = await sql`SELECT * FROM "class" C WHERE C.id = ${classID}`;
        return result[0];
    } catch (e) {
        // console.error(e);
        throw e;
    }
}

async function getClassessByUsername(username) {
    try {
        const result = await sql`SELECT C.id, C.name, C.type FROM "class" C INNER JOIN "user" U ON U.id = C.organizer_Id WHERE U.email = ${username}`;
        return result;
    } catch (e) {
        // console.error(e);
        throw e;
    }
}

async function updateClass(classID, classDetails) {
    try {
        const result = await sql`UPDATE "class" SET
        name = ${classDetails.name},
        type = ${classDetails.type}
        WHERE id = ${classID}`;
        return result;
    } catch (e) {
        console.error(e);
    }
}

// Participants
app.get('/participants', async (request, response) => {
    try {
        const result = await getParticipants();
        if (result) {
            response.send(result);
        } else {
            response.send().status("Participants do not exist.");
        }
    } catch (e) {
        response.status(500).send({ message: e.message })
    }
});

app.get('/participants/:id', async (request, response) => {
    try {
        const participantID = parseInt(request.params.id);
        if ((participantID != null) && (participantID !== undefined)) {
            const result = await getParticipantById(participantID);
            if (result) {
                response.send(result);
            }
        } else {
            response.send().status(404)
        }
    } catch (e) {
        response.status(500).send({ message: e.message })
    }
});

app.put('/participants/:id', async (request, response) => {
    const participantID = parseInt(request.params.id);
    const participant = request.body;
    const updatedParticipant = await updateParticipant(participantID, participant);
    if (updatedParticipant) {
        response.send(updatedParticipant);
    } else {
        response.sendStatus(404);
    }
});

async function updateParticipant(participantID, participant) {
    try {
        const result = await sql`UPDATE "participant" SET
        first_name = ${participant.first_name},
        last_name = ${participant.last_name},
        birth_date = ${participant.birth_date}
        WHERE id = ${participantID}`;
        return result;
    } catch (e) {
        console.error(e);
    }
}

async function getParticipants() {
    try {
        let query = await sql`SELECT * FROM "participant"`
        return query
    } catch (e) {
        console.error(e)
    }
}

async function getParticipantsByClassId(classID) {
    try {
        const result = await sql`SELECT P.* FROM participant P INNER JOIN class_participant CP ON CP.participant_id = P.id WHERE CP.class_id = ${classID}`;
        return result;
    } catch (e) {
        // console.error(e);
        throw e;
    }
}

async function getParticipantById(participantId) {
    try {
        const result = await sql`SELECT * FROM "participant" WHERE id = ${participantId}`;
        return result[0];
    } catch (e) {
        // console.error(e);
        throw e;
    }
}

app.listen(port, () => console.log(` My App listening at http://localhost:${port}`));