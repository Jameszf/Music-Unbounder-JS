
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



function softTeacherMatch(teach) {
    return new Promise((resolve, reject) => {
        db.collection("Teachers")
            .where("Name", "==", teach["Name"])
            .where("Email", "==", teach["Email"])
            .where("Phone", "==", teach["Phone"])
            .get().then(snapshot => {
                resolve(!snapshot.empty)
            }).catch(err => reject(err))
}



function softStudentMatch(stud) {
    return new Promise((resolve, reject) => {
        db.collection("Students")
            .where("Registerd_ID", "==", stud["Registered_ID"])
            .where("Teacher_ID", "==", stud["Teacher_ID"])
            .get().then(snapshot => {
                resolve(!snapshot.empty)
            }).catch(err => reject(err))
}



function softRegisteredMatch(reg) {
    return new Promise((resolve, reject) => {
        db.collection("Registered")
            .where("Name", "==", reg["Name"])
            .where("Guardian", "==", reg["Guardian"])
            .where("Instrument", "==", reg["Instrument"]).get().then(snapshot => {
                resolve(!snapshot.empty)
            }).catch(err => reject(err))
}



async function exists(coll, input) {
    return new Promise((resolve, reject) => {
        if (coll === undefined) reject("Need collection to search with.")
        if (typeof input === "string") { // search by ID
            db.collection(coll)
                .doc(input).get().then(snapshot => {
                    resolve(!snapshot.empty)
                }).catch(err => reject(err))
        } else {
            if (coll === "Teachers") {
                resolve(await softTeacherMatch(input))
            } else if (coll === "Students") {
                resolve(await softStudentMatch(input))
            } else if (coll === "Registered) {
                resolve(await softRegisteredMatch(input))
            } else {
                reject(`Unmatchable input: (collection) ${coll}\n(input) ${input}`)
            }
        }
    })
}



function newHistory(hist) {
    const docRef = db.collection("History").doc()
    hist["ID"] = docRef.id
    docRef.set(hist)
}



function searchByFields(collection, fieldValues) {
    let req = db.collection(collection)
    Object.keys(fieldValues).forEach(key => {
        req = req.where(key, "==", fieldValues[key])
    })
    return getDocsFromQuery(req)
}



function addToFirestore(obj) {
    // TODO add support for Jobs
    let collection
    if (obj instanceof Teacher) {
        collection = "Teachers"
    } else if (obj instanceof Student) {
        collection = "Students"
    } else if (obj instanceof Registered) {
        collection = "Registered"
    } else {
        console.log(`Couldn't process object ${obj}`)
        return
    }

    const data = obj.toObj()
    
    let ref
    if (obj["ID"] == undefined) {
        ref = db.collection(collection).doc()
        data["ID"] = ref.id
    } else {
        ref = db.collection(collection).doc(obj["ID"])
    }

    const fields = FireDoc.getFields(obj)
    Object.keys(fields).forEach(key => {
        if (obj[key] === undefined) obj[key] = ""
    })

    console.log("New Doc", docRef.id)
    docRef.set(data)
    
    const hist = {
        Doc_ID: data["ID"],
        New_State: data,
        Note: "Automatic addition to firestore.",
        Operation: "CREATE",
        Time: Date.now()
    }
    newHistory(hist)
    return data 
} 



function getAllDocs(collection) {
    return getDocsFromQuery(db.collection(collection))
}



module.exports = {
    getAllDocs,
    exists,
    addToFirestore,
    searchByFields,
}


