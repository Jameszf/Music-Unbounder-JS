
const firebase = require("firebase-admin")
const fs = require("fs")


const SERVICE_ACCOUNT_PATH = "serviceAccount.json"

const serviceAccount = fs.readFileSync(SERVICE_ACCOUNT_PATH)


firebase.initializeApp({
    credential: firebase.credential.cert(
                    JSON.parse(serviceAccount))
})
        
const db = firebase.firestore()



function getDocsFromQuery(query) {
    return new Promise((resolve, reject) => {
        query.get().then(snapshot => {
            const docs = []
            snapshot.forEach(doc => {
                docs.push(doc.data())
            })
            resolve(docs)
        }).catch(err => reject(err))
    })
}



function getAllJobs() {
    return getDocsFromQuery(db.collection("Jobs"))
}



async function regExists(reg) {
    return new Promise((resolve, reject) => {
        db.collection("Registered")
            .where("Name", "==", reg.Name)
            .where("Guardian", "==", reg.Guardian)
            .where("Instrument", "==", reg.Instrument).get().then(snapshot => {
                resolve(!snapshot.empty)
            }).catch(err => reject(err))
    })
}



function newHistory(hist) {
    const docRef = db.collection("History").doc()
    hist["ID"] = docRef.id
    docRef.set(hist)
}



// DOES NOT CHECK IF REG IS ALREADY IN DB
function addRegistered(reg) {
    const docRef = db.collection("Registered").doc()
    reg["ID"] = docRef.id
    reg["Joined_On"] = reg["Joined_On"] != undefined ? reg["Joined_On"] : Date.now()

    const data = {...reg}
    Object.keys(data).forEach(x => {
        if (x != "Joined_On" && x != "ID" && data[x] == undefined) {
            data[x] = ""
        }
    })

    console.log("New Doc", docRef.id)
    docRef.set(data)
    
    const hist = {
        Doc_ID: data["ID"],
        New_State: data,
        Note: "Automatic registation from register.musicunbounded@gmail.com.",
        Operation: "CREATE",
        Time: Date.now()
    }
    newHistory(hist)
    return data 
}



function createJob(job) {
    const ref = db.collection.doc()
    const json = job.json()
    json["ID"] = ref.id
    
    ref.set(json)
}



function getRegsByName(name) {
    return getDocsFromQuery(db.collection("Registered").where("Name", "==", name))
}



function getTeachersById(id) {
    return getDocsFromQuery(db.collection("Teachers").where("Discord_ID", "==", id))
}



function getEmptyDoc(collectionName) {
    return db.collection(collectionName).doc()
}



function addTeacher(data) {
    const ref = db.collection("Teachers").doc()
    data["ID"] = ref.id
    ref.set(data)
}



module.exports = {
    getAllJobs,
    regExists,
    addRegistered,
    addTeacher,
    createJob,
    getRegsByName,
    getTeachersById,
}


