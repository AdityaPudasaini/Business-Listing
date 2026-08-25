// listings.controller.ts
// TODO: implement the routes below. Full working example is in the guideline docx, Part C, "Listings Module".
// Routes to build:
//   GET    /businesses                  — list all listings (with filters)
//   GET    /businesses/:id              — get a single listing's detail
//   POST   /businesses                  — register a new business
//   PATCH  /businesses/:id              — listing update
import { Controller, Get } from '@nestjs/common';
import { ListingsService } from './listings.service';

@Controller('businesses')
export class ListingsController {
  constructor(private readonly listingsService: ListingsService) {}

  @Get()
  findAll() {
    // TODO: replace this placeholder with a real Prisma query once your model is in schema.prisma
    return this.listingsService.placeholder();
  }
}
