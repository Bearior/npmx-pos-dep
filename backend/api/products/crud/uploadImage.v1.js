const { supabaseAdmin } = require("../../../config/supabase");
const { v4: uuidv4 } = require("uuid");

const BUCKET = "product-images";

/**
 * @desc    Upload a product image to Supabase Storage
 * @route   POST /api/products/upload-image
 * @access  Private (admin, manager)
 * @body    { image: "data:image/png;base64,..." }
 */
module.exports = async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ success: false, message: "No image provided" });
    }

    // Parse data-URI: data:image/<ext>;base64,<data>
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ success: false, message: "Invalid image format. Send a data URI (data:image/...;base64,...)" });
    }

    const ext = matches[1] === "jpeg" ? "jpg" : matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, "base64");
    const fileName = `${uuidv4()}.${ext}`;

    // Ensure bucket exists and has correct file size limit
    const { data: buckets } = await supabaseAdmin.storage.listBuckets();
    const exists = (buckets || []).some((b) => b.name === BUCKET);
    if (!exists) {
      await supabaseAdmin.storage.createBucket(BUCKET, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      });
    } else {
      // Update existing bucket to ensure size limit is current
      await supabaseAdmin.storage.updateBucket(BUCKET, {
        public: true,
        fileSizeLimit: 10 * 1024 * 1024, // 10 MB
      });
    }

    // Upload
    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
        upsert: false,
      });

    if (uploadError) {
      return res.status(500).json({ success: false, message: uploadError.message });
    }

    // Return public URL
    const { data: urlData } = supabaseAdmin.storage.from(BUCKET).getPublicUrl(fileName);

    res.status(200).json({ url: urlData.publicUrl });
  } catch (err) {
    console.error("Image upload error:", err);
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
};
