require('dotenv').config()
const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY 
const supabaseBucket = process.env.SUPABASE_BUCKET

if (!supabaseUrl || !supabaseKey) {
   throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY')
}

const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null


const buildTimestampPrefix = () => {
    const now = new Date()
    const yyyy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const hh = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const ss = String(now.getSeconds()).padStart(2, '0')
    const ms = String(now.getMilliseconds()).padStart(3, '0')
    return `${yyyy}${mm}${dd}_${hh}${min}${ss}_${ms}`
}

const makeUniqueFileName = (inputFileName) => {
    const timestamp = buildTimestampPrefix()
    const ext = path.extname(inputFileName)
    const base = path.basename(inputFileName, ext).replace(/\s+/g, '_')
    return `${timestamp}_${base}${ext}`
}

const uploadFileToSupabase = async (filePath, options = {}) => {
    try {
        if (!supabase) {
            throw new Error('Supabase is not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY')
        }

        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`)
        }

        const providedName = options.fileName || path.basename(filePath)
        const fileName = makeUniqueFileName(providedName)
        const destinationPath = options.destinationPath || `orders/${fileName}`

        
        const ext = path.extname(fileName).toLowerCase()
        let contentType = 'application/octet-stream'
        if (ext === '.pdf') contentType = 'application/pdf'
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg'
        if (ext === '.png') contentType = 'image/png'
        if (ext === '.webp') contentType = 'image/webp'
        if (ext === '.gif') contentType = 'image/gif'

        const fileBuffer = fs.readFileSync(filePath)

        const { error: uploadError } = await supabase.storage
            .from(supabaseBucket)
            .upload(destinationPath, fileBuffer, {
                contentType,
                upsert: false
            })

        if (uploadError) {
            throw uploadError
        }

        const { data: publicUrlData } = supabase.storage
            .from(supabaseBucket)
            .getPublicUrl(destinationPath)

        if (!publicUrlData || !publicUrlData.publicUrl) {
            throw new Error('Failed to get public URL from Supabase')
        }

        return publicUrlData.publicUrl
    } catch (e) {
        throw new Error(`File upload failed: ${e.message}`)
    }
}



module.exports = {uploadFileToSupabase }


