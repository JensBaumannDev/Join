import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Sidebar } from './components/sidebar/sidebar';
import { Header } from './components/header/header';
import { AddTask } from "./components/add-task/add-task";
import { Summary } from "./components/summary/summary";
import { Board } from "./components/board/board";
import { Contacts } from "./components/contacts/contacts";

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Sidebar, Header, AddTask, Summary, Board, Contacts],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('join');
}
