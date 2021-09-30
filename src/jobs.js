
const db = require("./firestore.js")

/*
    CRUD
*/

function getAllJobs() {
    return db.getAllDocs("Jobs")
}



function getAllExpiredJobs() {
    const jobs = getAllJobs()
    return jobs.filter(x => x["Time"] < Date.now())
}



function refreshExpiredJobs() {
    const jobs = getAllExpiredJobs()
    removeJobs(jobs.map(job => job["ID"]))
    
    jobs.forEach(job => {
        createJob(job)
    })
}



function getAllTodoJobs() {
    const jobs = getAllJobs()
    return jobs.filter(x => x["Time"] > Date.now())
}



function getAllActiveJobs() {
    const jobs = getAllTodoJobs()
    return jobs.filter(x => x["Complete"] == true)
}



function createJob(job) {
    db.addToFirestore("Jobs", job)
}



function removeJobs(jobIds) {
    if (!Array.isArray(jobIds)) jobIds = [jobIds]
    jobIds.forEach(id => db.removeDoc("Jobs", id))
}


module.exports = {
    removeJobs,
    getAllActiveJobs,
    getAllExpiredJobs,
}

