import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { MailService } from './mail.service';
import { BookingSchema, InterviewBooking } from './schemas/booking.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: InterviewBooking.name, schema: BookingSchema }])],
  controllers: [BookingController],
  providers: [BookingService, MailService],
})
export class BookingModule {}
