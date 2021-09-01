
class Registered {
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

    

    static empty() {
        return new Registered(undefined, undefined, 
                                undefined, undefined, 
                                undefined, undefined, 
                                undefined, undefined, 
                                undefined, undefined,
                                undefined, undefined)
    }

    
    static fromObj(obj) {
        const fields = ["ID", "Name", "Guardian", 
                        "Instrument", "Platform", 
                        "Email", "Phone", "Prefers", 
                        "From", "Statement", 
                        "Joined_On", "Delivery"]
        const reg = Registered.empty()
        
        for (let field of fields) {
            reg[field] = obj[field]
        }
        
        return reg
    }



    getEmbedFields() {
        // TODO remove dupe code with registered.js
        const fields = []
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
        const mapping = {
            "ID": "Document ID",
            "Phone": "Phone Number", 
            "Joined_On": "Joined On",
            "Found": "Found us from",
        }

        for (let field of order) {
            const inline = inlines.has(field)
            let key = mapping[field], value = this[field]
            if (key == undefined) key = field
            if (value == "" || value == undefined) value = "N/A"
            fields.push({name: key, value, inline})
        }

        return fields
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
    Email
}


