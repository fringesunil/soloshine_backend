require('dotenv').config()
const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const cloudinary = require('cloudinary').v2

// Supabase
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabaseBucket = process.env.SUPABASE_BUCKET
const supabase = (supabaseUrl && supabaseKey) ? createClient(supabaseUrl, supabaseKey) : null

// Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

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

const uploadFileToStorage = async (filePath, options = {}) => {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`)
        }

        const providedName = options.fileName || path.basename(filePath)
        const fileName = makeUniqueFileName(providedName)
        const ext = path.extname(fileName).toLowerCase()

        if (ext === '.pdf') {
            // Upload to Supabase
            if (!supabase) {
                throw new Error('Supabase is not configured.')
            }

            const destinationPath = options.destinationPath || `pdfs/orders/${fileName}`
            const contentType = 'application/pdf'
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
        } else {
            // Upload to Cloudinary
            if (!process.env.CLOUDINARY_CLOUD_NAME) {
                throw new Error('Cloudinary is not configured.')
            }

            const destinationFolder = options.folder || 'soloshine_orders'

            const result = await cloudinary.uploader.upload(filePath, {
                folder: destinationFolder,
                resource_type: 'auto' // Handle any image format
            });

            return result.secure_url;
        }

    } catch (e) {
        throw new Error(`File upload failed: ${e.message}`)
    }
}

const extractCloudinaryPublicId = (url) => {
    try {
        const parts = url.split('/');
        const versionIndex = parts.findIndex(part => part.startsWith('v') && !isNaN(part.substring(1)));
        if (versionIndex !== -1 && versionIndex < parts.length - 1) {
            const pathParts = parts.slice(versionIndex + 1);
            const fileNameWithExt = pathParts.join('/');
            const extIndex = fileNameWithExt.lastIndexOf('.');
            return extIndex !== -1 ? fileNameWithExt.substring(0, extIndex) : fileNameWithExt;
        }
    } catch (err) { }
    return null;
}

const deleteFilesFromStorage = async (fileUrls) => {
    try {
        if (!fileUrls || fileUrls.length === 0) return;

        for (const url of fileUrls) {
            try {
                if (!url) continue;

                if (url.includes('supabase.co')) {
                    if (!supabase || !supabaseBucket) continue;
                    const parts = url.split(`/public/${supabaseBucket}/`);
                    if (parts.length > 1) {
                        const pathToDelete = parts[1];
                        await supabase.storage.from(supabaseBucket).remove([pathToDelete]);
                    }
                } else if (url.includes('cloudinary.com')) {
                    const publicId = extractCloudinaryPublicId(url);
                    if (publicId) {
                        await cloudinary.uploader.destroy(publicId);
                    }
                }
            } catch (err) {
                console.error("Error deleting file:", err);
            }
        }
    } catch (e) {
        console.error(`File deletion failed: ${e.message}`);
    }
}

const getStorageSizeStats = async (folderPath = '') => {
    try {
        let stats = {
            supabaseBytes: 0,
            cloudinaryBytes: 0
        };

        if (supabase && supabaseBucket) {
            const getSupabaseFolderSize = async (folder) => {
                let total = 0;
                const { data, error } = await supabase.storage.from(supabaseBucket).list(folder, {
                    limit: 100,
                    offset: 0,
                    sortBy: { column: 'name', order: 'asc' },
                });
                if (!error && data) {
                    for (const item of data) {
                        if (item.id === null && item.name !== '.emptyFolderPlaceholder') {
                            total += await getSupabaseFolderSize(folder ? `${folder}/${item.name}` : item.name);
                        } else if (item.metadata && item.metadata.size) {
                            total += item.metadata.size;
                        }
                    }
                }
                return total;
            };
            try {
                stats.supabaseBytes = await getSupabaseFolderSize(folderPath);
            } catch (e) { }
        }

        if (process.env.CLOUDINARY_API_KEY) {
            try {
                const usage = await cloudinary.api.usage();
                stats.cloudinaryBytes = usage.storage && usage.storage.usage ? usage.storage.usage : 0;
            } catch (e) { }
        }

        return stats;
    } catch (e) {
        console.error(`Status check failed: ${e.message}`);
        return { supabaseBytes: 0, cloudinaryBytes: 0 };
    }
}

module.exports = { uploadFileToStorage, deleteFilesFromStorage, getStorageSizeStats }
