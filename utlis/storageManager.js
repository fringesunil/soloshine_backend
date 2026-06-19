require('dotenv').config()
const path = require('path')
const fs = require('fs')
const { createClient } = require('@supabase/supabase-js')
const cloudinary = require('cloudinary').v2
const axios = require('axios')
const FormData = require('form-data')

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

const uploadToImgBB = async (filePath) => {
    try {
        if (!process.env.IMGBB_API_KEY) {
            console.error('ImgBB API key is not configured.');
            return null;
        }

        const formData = new FormData();
        formData.append('image', fs.createReadStream(filePath));

        const response = await axios.post(
            `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
            formData,
            {
                headers: {
                    ...formData.getHeaders()
                }
            }
        );

        if (response.data && response.data.success && response.data.data) {
            return response.data.data.url;
        }
        return null;
    } catch (e) {
        console.error(`ImgBB upload failed: ${e.message}`);
        return null;
    }
}

const uploadFileToStorage = async (filePath, options = {}) => {
    try {
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`)
        }

        const providedName = options.fileName || path.basename(filePath)
        const fileName = makeUniqueFileName(providedName)
        const ext = path.extname(fileName).toLowerCase()

        let primaryUrl = '';
        let backupUrl = '';

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

            primaryUrl = publicUrlData.publicUrl;
            backupUrl = ''; // No backup for PDFs as requested
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

            primaryUrl = result.secure_url;

            // Upload backup to ImgBB
            try {
                const imgbbUrl = await uploadToImgBB(filePath);
                if (imgbbUrl) {
                    backupUrl = imgbbUrl;
                }
            } catch (backupErr) {
                console.error("Backup upload to ImgBB failed:", backupErr.message);
            }
        }

        return {
            url: primaryUrl,
            backupUrl: backupUrl
        };

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

const cleanOrphanedCloudinaryImages = async (activeImageUrls, startDate, endDate) => {
    try {
        if (!process.env.CLOUDINARY_API_KEY) {
            throw new Error('Cloudinary is not configured.');
        }

        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        const dbPublicIds = new Set();
        if (activeImageUrls && Array.isArray(activeImageUrls)) {
            activeImageUrls.forEach(url => {
                if (url && url.includes('cloudinary.com')) {
                    const publicId = extractCloudinaryPublicId(url);
                    if (publicId) {
                        dbPublicIds.add(publicId);
                    }
                }
            });
        }

        let nextCursor = null;
        let orphanedPublicIds = [];
        let totalChecked = 0;

        do {
            const result = await cloudinary.api.resources({
                type: 'upload',
                prefix: 'soloshine_orders/',
                max_results: 500,
                next_cursor: nextCursor
            });

            if (result && result.resources) {
                totalChecked += result.resources.length;
                for (const res of result.resources) {
                    if (!dbPublicIds.has(res.public_id)) {
                        const createdDate = new Date(res.created_at);
                        let matchesDateRange = true;
                        if (start && createdDate < start) {
                            matchesDateRange = false;
                        }
                        if (end && createdDate > end) {
                            matchesDateRange = false;
                        }
                        if (matchesDateRange) {
                            orphanedPublicIds.push(res.public_id);
                        }
                    }
                }
                nextCursor = result.next_cursor;
            } else {
                break;
            }
        } while (nextCursor);

        let deletedCount = 0;
        for (let i = 0; i < orphanedPublicIds.length; i += 100) {
            const chunk = orphanedPublicIds.slice(i, i + 100);
            const delResult = await cloudinary.api.delete_resources(chunk);
            if (delResult && delResult.deleted) {
                deletedCount += Object.keys(delResult.deleted).length;
            }
        }

        return {
            success: true,
            totalChecked,
            orphanedCount: orphanedPublicIds.length,
            deletedCount
        };
    } catch (e) {
        throw new Error(`Cloudinary cleanup failed: ${e.message}`);
    }
}

module.exports = { uploadFileToStorage, deleteFilesFromStorage, getStorageSizeStats, cleanOrphanedCloudinaryImages }
