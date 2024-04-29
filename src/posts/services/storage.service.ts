import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import { MemoryStoredFile } from 'nestjs-form-data';
import { promisify } from 'util';

@Injectable()
export class StorageService {
  /**
   * Checks whether a file or directory exists at the specified path.
   * @param {string} path - The path to check for existence.
   * @returns {boolean} - True if a file or directory exists at the specified path, otherwise false.
   */
  checkDirectory(path: string) {
    return fs.existsSync(path);
  }

  /**
   * Create a directory if it doesn't exist.
   * @param directoryPath - Path of the directory to create.
   */
  createDirectoryIfNoExists(path: string) {
    const isExist = this.checkDirectory(path);
    if (!isExist) {
      fs.mkdirSync(path);
    }
  }

  /**
   * Upload a file and return its path.
   * @param file - File to upload.
   * @param destination - Destination directory for the uploaded file.
   * @param slug - Slug to use in the file name.
   * @returns The relative file path.
   */
  async uploadFile(file: MemoryStoredFile, destination: string, slug: string) {
    const { originalName, buffer } = file;

    // Generate file path
    const spliteedFileName = originalName.split('.');
    const splittedFileNameLength = spliteedFileName.length;
    const filePath =
      destination + `/${slug}.${spliteedFileName[splittedFileNameLength - 1]}`;

    // Write file to disk
    await promisify(fs.writeFile)(filePath, buffer);
    // Return relative file path
    return filePath.split('public')[1];
  }

  /**
   * Synchronously removes a file at the specified path if it exists.
   * @param {string} path - The path to the file to be removed.
   */
  removeFile(path: string) {
    // Check if the file exists
    const isExist = this.checkDirectory(path);
    // If the file exists, delete it
    if (isExist) {
      fs.unlinkSync(path);
    }
  }
}
