package in.raghav.notebooktodo.controller;

import in.raghav.notebooktodo.dto.AddTaskRequest;
import in.raghav.notebooktodo.dto.CarryForwardRequest;
import in.raghav.notebooktodo.dto.DayFeedItem;
import in.raghav.notebooktodo.dto.TodayResponse;
import in.raghav.notebooktodo.dto.UpdateTaskRequest;
import in.raghav.notebooktodo.model.Day;
import in.raghav.notebooktodo.model.Task;
import in.raghav.notebooktodo.service.DayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/days")
@RequiredArgsConstructor
public class DayController {

    private final DayService dayService;

    @GetMapping("/today")
    public TodayResponse getToday() {
        Day today = dayService.getOrCreateToday();
        return new TodayResponse(
                today,
                dayService.shouldPromptCarryForward(today),
                dayService.getYesterdayUnfinishedTasks()
        );
    }

    @PostMapping("/today/carry-forward")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void carryForward(@Valid @RequestBody CarryForwardRequest request) {
        dayService.carryForward(request.taskIds());
    }

    @GetMapping
    public List<DayFeedItem> getDayFeed() {
        return dayService.getDayFeed().stream().map(DayFeedItem::from).toList();
    }

    @GetMapping("/{date}")
    public Day getDayByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return dayService.getDayByDate(date);
    }

    @PostMapping("/today/tasks")
    @ResponseStatus(HttpStatus.CREATED)
    public Task addTask(@Valid @RequestBody AddTaskRequest request) {
        return dayService.addTask(request.text(), request.priority());
    }

    @PatchMapping("/today/tasks/{id}")
    public Task updateTask(@PathVariable String id, @RequestBody UpdateTaskRequest request) {
        return dayService.updateTask(id, request.text(), request.done(), request.priority());
    }

    @DeleteMapping("/today/tasks/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable String id) {
        dayService.deleteTask(id);
    }

    @PostMapping("/today/pull/{date}/{taskId}")
    @ResponseStatus(HttpStatus.CREATED)
    public Task pullTask(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date,
            @PathVariable String taskId) {
        return dayService.pullTask(date, taskId);
    }
}
