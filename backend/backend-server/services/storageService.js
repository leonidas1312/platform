const AWS = require('aws-sdk')
const fs = require('fs').promises
const path = require('path')

class StorageService {
  constructor() {
    this.useS3 = process.env.USE_S3_STORAGE === 'true'
    
    if (this.useS3) {
      this.s3 = new AWS.S3({
        endpoint: process.env.S3_ENDPOINT || 'https://nyc3.digitaloceanspaces.com',
        accessKeyId: process.env.S3_ACCESS_KEY,
        secretAccessKey: process.env.S3_SECRET_KEY,
        region: process.env.S3_REGION || 'nyc3',
        s3ForcePathStyle: false,
        signatureVersion: 'v4'
      })
      this.bucketName = process.env.S3_BUCKET_NAME || 'rastion-datasets'
    }
  }

  /**
   * Store a file (either locally or in S3)
   */
  async storeFile(localFilePath, fileName, folder = 'datasets') {
    if (this.useS3) {
      return await this.storeFileS3(localFilePath, fileName, folder)
    } else {
      return await this.storeFileLocal(localFilePath, fileName, folder)
    }
  }

  /**
   * Store file locally
   */
  async storeFileLocal(localFilePath, fileName, folder) {
    const uploadDir = path.join(__dirname, '../uploads', folder)
    await fs.mkdir(uploadDir, { recursive: true })
    
    const finalPath = path.join(uploadDir, fileName)
    await fs.copyFile(localFilePath, finalPath)
    
    return finalPath
  }

  /**
   * Store file in S3
   */
  async storeFileS3(localFilePath, fileName, folder) {
    const fileContent = await fs.readFile(localFilePath)
    const key = `${folder}/${fileName}`
    
    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: fileContent,
      ACL: 'private'
    }
    
    const result = await this.s3.upload(params).promise()
    return result.Location
  }

  /**
   * Get file stream (for downloads)
   */
  async getFileStream(filePath) {
    if (this.useS3) {
      const key = filePath.replace(`https://${this.bucketName}.nyc3.digitaloceanspaces.com/`, '')
      return this.s3.getObject({
        Bucket: this.bucketName,
        Key: key
      }).createReadStream()
    } else {
      return require('fs').createReadStream(filePath)
    }
  }

  /**
   * Check if file exists
   */
  async fileExists(filePath) {
    if (this.useS3) {
      try {
        const key = filePath.replace(`https://${this.bucketName}.nyc3.digitaloceanspaces.com/`, '')
        await this.s3.headObject({
          Bucket: this.bucketName,
          Key: key
        }).promise()
        return true
      } catch (error) {
        return false
      }
    } else {
      try {
        await fs.access(filePath)
        return true
      } catch (error) {
        return false
      }
    }
  }

  /**
   * Delete file
   */
  async deleteFile(filePath) {
    if (this.useS3) {
      const key = filePath.replace(`https://${this.bucketName}.nyc3.digitaloceanspaces.com/`, '')
      await this.s3.deleteObject({
        Bucket: this.bucketName,
        Key: key
      }).promise()
    } else {
      await fs.unlink(filePath)
    }
  }
}

module.exports = new StorageService()
