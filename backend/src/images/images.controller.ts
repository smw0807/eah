import { Body, Controller, Post } from '@nestjs/common';
import { ImagesService } from './images.service';

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload')
  async uploadImage(@Body() body: { file: File; filePath: string }) {
    return this.imagesService.uploadImage(body.file, body.filePath);
  }
}
