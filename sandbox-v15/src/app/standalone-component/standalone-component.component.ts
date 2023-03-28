import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-standalone-component',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './standalone-component.component.html',
  styleUrls: ['./standalone-component.component.css']
})
export class StandaloneComponentComponent {

}
