import { Downloaded_File } from "../teapot/models/index.js";
import { sequelize } from "../teapot/sqlite/sqlite_db.js";
import { _error } from "../shared/utils.js";

export class DatabaseService {
  static async isFileDownloaded(postId, postHash = null) {
    try {
      const whereCondition = { postId };
      if (postHash) whereCondition.postHash = postHash;

      const existingFile = await Downloaded_File.findOne({
        where: whereCondition,
        attributes: ['id', 'fileName', 'searchName'],
      });

      return existingFile;
    } catch (error) {
      _error(`Error checking if file is downloaded: ${error.message}`);
      return null;
    }
  }

  static async recordDownloadedFile(fileInfo) {
    try {
      const downloadedFile = await Downloaded_File.create(fileInfo);
      return downloadedFile;
    } catch (error) {
      _error(`Error recording downloaded file: ${error.message}`);
      return null;
    }
  }

  static async removeFileRecord(postId) {
    try {
      const deletedRows = await Downloaded_File.destroy({
        where: { postId },
      });
      return deletedRows > 0;
    } catch (error) {
      _error(`Error removing file record: ${error.message}`);
      return false;
    }
  }

  static async getDownloadStats() {
    try {
      const [totalFiles, filesBySearch, filesByExtension] = await Promise.all([
        Downloaded_File.count(),
        Downloaded_File.findAll({
          attributes: [
            "searchName",
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          group: ["searchName"],
          raw: true,
        }),
        Downloaded_File.findAll({
          attributes: [
            "fileExtension", 
            [sequelize.fn("COUNT", sequelize.col("id")), "count"],
          ],
          group: ["fileExtension"],
          raw: true,
        })
      ]);

      return {
        totalFiles,
        filesBySearch,
        filesByExtension,
      };
    } catch (error) {
      _error(`Error getting download stats: ${error.message}`);
      return null;
    }
  }

  static async bulkRecordFiles(filesInfo) {
    try {
      const downloadedFiles = await Downloaded_File.bulkCreate(filesInfo, {
        ignoreDuplicates: true,
      });
      return downloadedFiles;
    } catch (error) {
      _error(`Error bulk recording files: ${error.message}`);
      return null;
    }
  }
}