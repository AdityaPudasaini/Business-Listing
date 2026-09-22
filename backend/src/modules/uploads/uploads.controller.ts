// uploads.controller.ts
//   POST /uploads  — logged-in users only. Multipart form, one image in a field named "file".
//                    Responds with { url } which the frontend then sends with the listing.
import { Controller, Post, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { MAX_IMAGE_BYTES, UploadedImage, UploadsService } from './uploads.service';

@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    // No `storage` option = multer keeps the file in memory, so the service can
    // inspect it before anything is written to disk.
    FileInterceptor('file', { limits: { fileSize: MAX_IMAGE_BYTES, files: 1 } }),
  )
  upload(@UploadedFile() file?: UploadedImage) {
    return this.uploadsService.saveImage(file);
  }
}