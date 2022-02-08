import { Request, Response, Router } from 'express';
import { upload } from '../middleware/multer.middleware';
import { AWSUploader } from '../middleware/upload.middleware';

export class UploadController {
  path = '/*';

  router = Router();

  constructor() {
    this.checkRoutes();
  }

  checkRoutes() {
    this.router.post('/*', this.uploadFile.bind(this));
  }

  uploadFile(req: Request, res: Response) {
    // if (req.file) {
    //
    // }
    const uploadFileToS3 = upload.single('file');
    uploadFileToS3(req, res, (err) => {
      if (err) {
        return res.status(422).send({ message: err.message });
      }

      if (req.file) {
        const params = {
          Body: req.file.buffer,
          Bucket: <string>process.env.BUCKET,
          Key: '',
        };
        const fileName = req.file.originalname;
        if (req.file.mimetype.includes('image/') && req.file.mimetype !== 'image/gif') {
          const img = new AWSUploader();
          const largeImg = img.uploadImg(params, 2048, fileName, 'large');
          const mediumImg = img.uploadImg(params, 1024, fileName, 'medium');
          const thumbImg = img.uploadImg(params, 300, fileName, 'thumb');

          Promise.all([largeImg, mediumImg, thumbImg])
            .then(() => {
              res
                .status(200)
                .send({ message: 'The image has been successfully converted and uploaded' });
            })
            .catch(() => {
              res.status(409).send({ message: 'Something went wrong.' });
            });
        } else {
          const file = new AWSUploader();
          file
            .uploadCommonFile(params, fileName)
            .then(() => {
              res.status(200).send({ message: 'File successfully uploaded' });
            })
            .catch(() => {
              res.status(409).send({ message: 'Something went wrong.' });
            });
        }
      }
    });
  }
}
