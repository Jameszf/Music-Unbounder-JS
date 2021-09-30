
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



async function exists(coll, input) {
    return new Promise((resolve, reject) => {
        if (coll === undefined) reject("Need collection to search with.")
        if (typeof input === "string") { // search by ID
            db.collection(coll).doc(input).get()
                .then(snapshot => {
                    resolve(!snapshot.empty)
                }).catch(err => reject(err))
        } else {
            const data = input.toObj()
            let queryValues
            if (coll === "Teachers") {
                queryValues = {
                    "Name": data["Name"],
                    "Email": data["Email"],
                    "Phone": data["Phone"],
                }
            } else if (coll === "Students") {
                queryValues = {
                    "Registered_ID": data["Registered_ID"],
                    "Teacher_ID": data["Teacher_ID"],
                }
            } else if (coll === "Registered") {
                queryValues = {
                    "Name": data["Name"],
                    "Guardian": data["Guardian"],
                    "Instrument": data["Instrument"],
                }
            } else {
                reject(`Unmatchable input: (collection) ${coll}\n(input) ${input}`)
            }

            searchByFields(coll, queryValues)
                .then(docs => resolve(docs.length != 0))
                .catch(err => reject(err))
        }
    })
}



function newHistory(hist) {
    const docRef = db.collection("History").doc()
    hist["ID"] = docRef.id
    docRef.set(hist)
}



function searchByFields(collection, fieldValues) {
    return new Promise((resolve, reject) => {
        console.log(fieldValues)
        let req = db.collection(collection)
        Object.keys(fieldValues).forEach(key => {
            req = req.where(key, "==", fieldValues[key])
        })
        getDocsFromQuery(req)
            .then(docs => resolve(docs))
            .catch(err => reject(err))
    })
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

    let ref
    if (obj["ID"] == undefined) {
        ref = db.collection(collection).doc()
        obj["ID"] = ref.id
    } else {
        ref = db.collection(collection).doc(obj["ID"])
    }

    const data = obj.toObj()
    const fields = FireDoc.getFields(obj)
    Object.keys(fields).forEach(key => {
        if (data[key] === undefined) data[key] = ""
    })

    console.log("New Doc", docRef.id)
    docRef.set(data)
    
    const hist = {
        Doc_ID: data["ID"],
        New_State: data,
        Note: "Automatic addition to firestore from discord bot.",
        Operation: "CREATE",
        Time: Date.now()
    }
    newHistory(hist)
    return obj
} 



function removeDoc(collection, docId) {
    db.collection(collection).doc(docId).delete()

    const hist = {
        Doc_ID: docId,
        New_State: "N/A",
        Note: "Automatic deletion to firestore from discord bot.",
        Operation: "DELETE",
        Time: Date.now(),
    }
    newHistory(hist)
}



function getAllDocs(collection) {
    return getDocsFromQuery(db.collection(collection))
}



async function modifyDoc(collection, id, mods) {
    await db.collection(collection).doc(id).update(mods)
    const req = await db.collection(collection).doc(id).get()
    
    if (req.exists) {
        const newState = req.data()
        const hist = {
            "Doc_ID": id,
            "New_State": newState,
            "Note": "From discord bot.",
            "Operation": "UPDATE",
            "Time": Date.now(),
        }
        newHistory(hist)
    } else {
        console.log(`ERROR: modifyDoc could not get new state after modifying document ${id} in collection ${collection}. 
                    Applied these modifications: ${mods}`)
    }
}


async function getDocById(collection, docId) {
    return await db.collection(collection).doc(docId).get()
}



module.exports = {
    getAllDocs,
    getDocById,
    exists,
    addToFirestore,
    searchByFields,
}


