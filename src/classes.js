
class FireDoc {
    /*
        mapping: Object
        order: Array
        inlines: Set
    */

    static getFields(obj) {
        if (obj instanceof Registered || obj === "Registered") {
            return ["ID", "Name", "Guardian", 
                    "Instrument", "Platform", 
                    "Email", "Phone", "Prefers", 
                    "From", "Statement", 
                    "Joined_On", "Delivery"]
        } else if (obj instanceof Student || obj === "Students") {
            return ["ID", "Begin_Date", "End_Date",
                    "Notes", "Registered_ID", 
                    "Teacher_ID"]
        } else if (obj instanceof Teacher || obj === "Teachers") {
            return ["ID", "Discord_ID", "Email",
                    "Instruments", "Lessons",
                    "Name", "Phone", "Status"]
        } else {
            console.log(`Unrecognized object ${obj}`)
            return []
        }
    }
    


    toEmbed(mapping, order, inlines) {
        const { MessageEmbed } = require("discord.js")

        const fields = []

        let fieldOrder = order
        if (order == undefined) fieldOrder = Object.keys(mapping)

        for (let field of fieldOrder) {
            const inline = inlines != undefined ? inlines.has(field) : false
            let key = mapping[field], value = this[field]
            if (key == undefined) key = field
            if (value == "" || value == undefined) value = "N/A"
            fields.push({name: key, value, inline})
        }
        
        const embed = new MessageEmbed()
                .setColor("#f7f7f7")
                .setTitle(`Document ID: ${doc["ID"]}`)
        
        embed.addFields(fields)
        return embed
    }

    toObj() {
        const obj = {}
        Object.keys(this).map(key => obj[key] = this[key])
        return obj
    }
}



class Registered extends FireDoc {
    constructor(ID, Name, Guardian, Instrument, 
                Platform, Email, Phone, Prefers, 
                From, Statement, Joined_On, Delivery) {
        this.ID = ID
        this.Name = Name
        this.Guardian = Guardian
        this.Instrument = Instrument
        this.Platform = Platform
        this.Email = Email
        this.Phone = Phone
        this.Prefers = Prefers
        this.From = From
        this.Statement = Statement
        this.Joined_On = Joined_On
        this.Delivery = Delivery
    }
    
    

    static fromObj(obj) {
        const fields = Firedoc.getFields("Registered")
        const reg = new Registered()

        fields.forEach(field => reg[field] = obj[field])
        return reg
    }



    toEmbed() {
        const mapping = {
            "ID": "Document ID",
            "Phone": "Phone Number", 
            "Joined_On": "Joined On",
            "Found": "Found us from",
        }
        const order = ["Name", "Guardian", 
                        "Instrument", "Email", 
                        "Phone", "Prefers", 
                        "Platform", "Delivery", 
                        "Joined_On", "Statement"]

        const inlines = new Set(["Name", "Guardian", 
                                "Instrument", "Email", 
                                "Phone", "Prefers", 
                                "Platform", "Delivery", 
                                "Joined_On"])
        return super().toEmbed(mapping, order, inlines)
    }
}



class Teacher extends FireDoc {
    constructor(ID, Discord_ID, Email, Instruments, Lessons, Name, Phone, Status) {
        this.ID = ID
        this.Discord_ID = Discord_ID
        this.Email = Email
        this.Instruments = Instruments
        this.Lessons = Lessons
        this.Name = Name
        this.Phone = Phone
        this.Status = Status
    }

    static fromObj(obj) {
        const fields = Firedoc.getFields("Teachers")
        const teach = new Teacher()

        fields.forEach(field => teach[field] = obj[field])
        return teach
    }

    toEmbed() {
        const mapping = {}
        return super().toEmbed(mapping)
    }
}



class Student extends FireDoc {
    constructor(Begin_Date, End_Date, ID, Notes, Registered_ID, Teacher_ID) {
        this.Begin_Date = Begin_Date
        this.End_Date = End_Date
        this.ID = ID
        this.Notes = Notes
        this.Registered_ID = Registered_ID
        this.Teacher_ID = Teacher_ID
    }

    static fromObj(obj) {
        const fields = Firedoc.getFields("Students")
        const stud = new Student()

        fields.forEach(field => stud[field] = obj[field])
        return stud
    }

    toEmbed() {
        const mapping = {}
        return super().toEmbed(mapping)
    }
}



class Email {
    constructor(subject, body) {
        this.subject = subject
        this.body = body
    }

    toRegistered() {
        const vals = this.body.split("<br><br>")
        vals.pop()
        console.log(vals)

        const obj = {}
        for (let item of vals) {
            const re = /<strong>([\w|\s]+)<\/strong>\:\s(.+)/g
            const res = re.exec(item)
            if (res == null) {
                console.log(item, "is causing a null!")
            } else {
                obj[res[1]] = res[2]
            }
        }

        // Email entry name -> Class property name
        return new Registered(
            undefined,
            obj["Student Name"],
            obj["Guardian Name"],
            obj["Instrument"],
            obj["Preferred lesson platform"],
            obj["Email"],
            obj["Phone number"],
            obj["Please contact by phone number"] == "true" ? "Phone" : "Email",
            obj["Found out about us from"],
            obj["Statement about lesson times"],
            undefined,
            obj["Preferred lesson delivery method"],
        )
    }
}



class Job {
    constructor(Time, Type, Data) {
        this.Time = Time
        this.Type = Type
        this.Data = Data
    }

    json() {
        return {
            "Time": this.Time,
            "Type": this.Type,
            "Data": this.Data
        }
    }
}



module.exports = {
    Job,
    Registered,
    Email,
    Teacher,
    Student
}


